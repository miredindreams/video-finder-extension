import API from '../utils/api.js';
import Storage from '../utils/storage.js';

class BackgroundService {
  constructor() {
    this.api = new API();
    this.storage = new Storage();
    this.connections = new Map();
    this.init();
  }

  init() {
    this.setupListeners();
    this.setupAlarms();
    this.checkConnection();
  }

  setupListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true;
    });

    chrome.runtime.onInstalled.addListener((details) => {
      this.handleInstall(details);
    });

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdate(tabId, changeInfo, tab);
    });

    chrome.tabs.onRemoved.addListener((tabId) => {
      this.handleTabRemoved(tabId);
    });
  }

  setupAlarms() {
    chrome.alarms.create('clearCache', {
      periodInMinutes: 360
    });

    chrome.alarms.create('checkConnection', {
      periodInMinutes: 5
    });

    chrome.alarms.onAlarm.addListener((alarm) => {
      this.handleAlarm(alarm);
    });
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.action) {
        case 'SEARCH_MOVIE':
          const searchResult = await this.api.searchMovie(message.data);
          sendResponse({ success: true, data: searchResult });
          break;

        case 'GET_MOVIE_INFO':
          const movieInfo = await this.api.getMovieInfo(message.data);
          sendResponse({ success: true, data: movieInfo });
          break;

        case 'GET_SOURCES':
          const sources = await this.api.getMovieSources(message.data);
          sendResponse({ success: true, data: sources });
          break;

        case 'GET_SETTINGS':
          const settings = await this.storage.getSettings();
          sendResponse({ success: true, data: settings });
          break;

        case 'SAVE_SETTINGS':
          await this.storage.saveSettings(message.data);
          sendResponse({ success: true });
          break;

        case 'GET_HISTORY':
          const history = await this.storage.getSearchHistory();
          sendResponse({ success: true, data: history });
          break;

        case 'CLEAR_HISTORY':
          await this.storage.clearSearchHistory();
          sendResponse({ success: true });
          break;

        case 'CHECK_CONNECTION':
          const isOnline = await this.checkConnection();
          sendResponse({ success: true, data: { isOnline } });
          break;

        case 'REPORT_ISSUE':
          await this.reportIssue(message.data);
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ 
            success: false, 
            error: 'Неизвестное действие' 
          });
      }
    } catch (error) {
      console.error('Ошибка обработки сообщения:', error);
      sendResponse({ 
        success: false, 
        error: error.message 
      });
    }
  }

  async handleInstall(details) {
    const defaultSettings = {
      filters: {
        quality: '720',
        dubbing: 'original',
        language: 'ru',
        sources: ['filmix', 'hdrezka', 'kinopub']
      },
      appearance: {
        theme: 'dark',
        view: 'grid',
        fontSize: 'medium'
      },
      notifications: {
        enabled: true,
        sound: false
      },
      privacy: {
        saveHistory: true,
        analytics: false
      }
    };

    await this.storage.saveSettings(defaultSettings);

    if (details.reason === 'install') {
      chrome.tabs.create({
        url: chrome.runtime.getURL('welcome.html')
      });
    }

    this.createContextMenu();
  }

  createContextMenu() {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: 'search-movie',
        title: 'Найти варианты просмотра',
        contexts: ['selection']
      });

      chrome.contextMenus.create({
        id: 'search-title',
        title: 'Искать "%s" в Video Finder',
        contexts: ['selection']
      });
    });

    chrome.contextMenus.onClicked.addListener((info, tab) => {
      this.handleContextMenuClick(info, tab);
    });
  }

  async handleContextMenuClick(info, tab) {
    switch (info.menuItemId) {
      case 'search-movie':
      case 'search-title':
        await this.storage.set('quickSearchText', info.selectionText);
        
        chrome.action.openPopup();
        break;
    }
  }

  async handleTabUpdate(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url) {
      const supportedSites = [
        'kinopoisk.ru',
        'kinopoisk.dev',
        'imdb.com',
        'myanimelist.net'
      ];

      const isSupported = supportedSites.some(site => 
        tab.url.includes(site)
      );

      if (isSupported) {
        chrome.tabs.sendMessage(tabId, {
          action: 'PAGE_LOADED',
          url: tab.url
        }).catch(() => {
        });
      }
    }
  }

  handleTabRemoved(tabId) {
    this.connections.delete(tabId);
  }

  async handleAlarm(alarm) {
    switch (alarm.name) {
      case 'clearCache':
        await this.api.clearCache();
        break;

      case 'checkConnection':
        await this.checkConnection();
        break;
    }
  }

  async checkConnection() {
    try {
      const health = await this.api.getHealth();
      const isOnline = health && health.status === 'OK';
      
      await this.storage.set('connectionStatus', {
        isOnline,
        lastChecked: Date.now()
      });

      this.notifyConnectionChange(isOnline);

      return isOnline;
    } catch (error) {
      await this.storage.set('connectionStatus', {
        isOnline: false,
        lastChecked: Date.now()
      });
      return false;
    }
  }

  notifyConnectionChange(isOnline) {
    const settings = this.storage.getSettings();
    
    if (settings.notifications?.enabled) {
      const notificationOptions = {
        type: 'basic',
        iconUrl: 'assets/icons/icon128.png',
        title: 'Video Finder',
        message: isOnline ? 'Соединение с сервером восстановлено' : 'Нет соединения с сервером'
      };

      chrome.notifications.create('connection-status', notificationOptions);
    }
  }

  async reportIssue(issueData) {
    console.log('Отчет об ошибке:', issueData);
    
    const issues = await this.storage.get('reportedIssues') || [];
    issues.push({
      ...issueData,
      timestamp: Date.now(),
      version: chrome.runtime.getManifest().version
    });
    
    await this.storage.set('reportedIssues', issues.slice(-50));
  }

  async getStats() {
    const history = await this.storage.getSearchHistory();
    const settings = await this.storage.getSettings();
    
    return {
      searches: history.length,
      settings,
      version: chrome.runtime.getManifest().version
    };
  }

  async clearAllData() {
    await this.storage.clear();
    await this.api.clearCache();
    this.connections.clear();
  }
}

const backgroundService = new BackgroundService();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = BackgroundService;
}