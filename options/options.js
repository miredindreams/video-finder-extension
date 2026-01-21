import Storage from '../utils/storage.js';
import Notifications from '../utils/notifications.js';
import Constants from '../utils/constants.js';

class OptionsPage {
  constructor() {
    this.storage = new Storage();
    this.notifications = new Notifications();
    this.currentTab = 'general';
    
    this.init();
  }
  
  async init() {
    this.cacheElements();
    this.bindEvents();
    await this.loadSettings();
    this.setupTabs();
    this.setupTheme();
  }
  
  cacheElements() {
    this.elements = {
      // Табы
      tabButtons: document.querySelectorAll('.tab-btn'),
      tabContents: document.querySelectorAll('.tab-content'),
      
      // Общие настройки
      autoSearchCheckbox: document.getElementById('autoSearch'),
      saveHistoryCheckbox: document.getElementById('saveHistory'),
      showNotificationsCheckbox: document.getElementById('showNotifications'),
      notificationSoundCheckbox: document.getElementById('notificationSound'),
      autoPlayCheckbox: document.getElementById('autoPlay'),
      
      // Внешний вид
      themeSelect: document.getElementById('themeSelect'),
      viewModeSelect: document.getElementById('viewModeSelect'),
      fontSizeSelect: document.getElementById('fontSizeSelect'),
      animationsCheckbox: document.getElementById('animations'),
      
      // Фильтры
      defaultQuality: document.getElementById('defaultQuality'),
      defaultDubbing: document.getElementById('defaultDubbing'),
      defaultLanguage: document.getElementById('defaultLanguage'),
      sourceCheckboxes: document.querySelectorAll('.source-option'),
      
      // Конфиденциальность
      analyticsCheckbox: document.getElementById('analytics'),
      telemetryCheckbox: document.getElementById('telemetry'),
      clearHistoryBtn: document.getElementById('clearHistory'),
      clearCacheBtn: document.getElementById('clearCache'),
      exportDataBtn: document.getElementById('exportData'),
      importDataBtn: document.getElementById('importData'),
      importFile: document.getElementById('importFile'),
      
      // Уведомления
      requestNotificationBtn: document.getElementById('requestNotification'),
      testNotificationBtn: document.getElementById('testNotification'),
      
      // О расширении
      versionInfo: document.getElementById('versionInfo'),
      openDocsBtn: document.getElementById('openDocs'),
      reportIssueBtn: document.getElementById('reportIssue'),
      rateExtensionBtn: document.getElementById('rateExtension'),
      
      // Кнопки сохранения
      saveBtn: document.getElementById('saveBtn'),
      resetBtn: document.getElementById('resetBtn'),
      resetDefaultsBtn: document.getElementById('resetDefaults')
    };
  }
  
  bindEvents() {
    // Табы
    this.elements.tabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
    });
    
    // Сохранение настроек
    this.elements.saveBtn.addEventListener('click', () => this.saveSettings());
    this.elements.resetBtn.addEventListener('click', () => this.resetToSaved());
    this.elements.resetDefaultsBtn.addEventListener('click', () => this.resetToDefaults());
    
    // Конфиденциальность
    this.elements.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
    this.elements.clearCacheBtn.addEventListener('click', () => this.clearCache());
    this.elements.exportDataBtn.addEventListener('click', () => this.exportData());
    this.elements.importDataBtn.addEventListener('click', () => this.importData());
    this.elements.importFile.addEventListener('change', (e) => this.handleImportFile(e));
    
    // Уведомления
    this.elements.requestNotificationBtn.addEventListener('click', () => this.requestNotifications());
    this.elements.testNotificationBtn.addEventListener('click', () => this.testNotification());
    
    // О расширении
    this.elements.openDocsBtn.addEventListener('click', () => this.openDocumentation());
    this.elements.reportIssueBtn.addEventListener('click', () => this.reportIssue());
    this.elements.rateExtensionBtn.addEventListener('click', () => this.rateExtension());
    
    // Автосохранение при изменении настроек
    this.setupAutoSave();
  }
  
  setupTabs() {
    this.switchTab('general');
  }
  
  switchTab(tabName) {
    this.currentTab = tabName;
    
    // Обновляем активные табы
    this.elements.tabButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Показываем соответствующий контент
    this.elements.tabContents.forEach(content => {
      content.classList.toggle('active', content.id === `${tabName}Tab`);
    });
  }
  
  async loadSettings() {
    const settings = await this.storage.getSettings();
    
    // Общие настройки
    this.elements.autoSearchCheckbox.checked = settings.behavior?.autoSearch ?? true;
    this.elements.saveHistoryCheckbox.checked = settings.behavior?.saveHistory ?? true;
    this.elements.showNotificationsCheckbox.checked = settings.behavior?.showNotifications ?? true;
    this.elements.notificationSoundCheckbox.checked = settings.behavior?.notificationSound ?? false;
    this.elements.autoPlayCheckbox.checked = settings.behavior?.autoPlay ?? false;
    
    // Внешний вид
    this.elements.themeSelect.value = settings.appearance?.theme || 'dark';
    this.elements.viewModeSelect.value = settings.appearance?.view || 'grid';
    this.elements.fontSizeSelect.value = settings.appearance?.fontSize || 'medium';
    this.elements.animationsCheckbox.checked = settings.appearance?.animations ?? true;
    
    // Фильтры
    this.elements.defaultQuality.value = settings.filters?.quality || '720';
    this.elements.defaultDubbing.value = settings.filters?.dubbing || 'original';
    this.elements.defaultLanguage.value = settings.filters?.language || 'ru';
    
    // Источники
    const enabledSources = settings.filters?.sources || Constants.DEFAULT_SETTINGS.filters.sources;
    this.elements.sourceCheckboxes.forEach(checkbox => {
      checkbox.checked = enabledSources.includes(checkbox.value);
    });
    
    // Конфиденциальность
    this.elements.analyticsCheckbox.checked = settings.privacy?.analytics ?? false;
    this.elements.telemetryCheckbox.checked = settings.privacy?.telemetry ?? false;
    
    // Информация о версии
    this.elements.versionInfo.textContent = `Версия ${Constants.VERSION}`;
    
    // Применяем тему
    this.applyTheme(settings.appearance?.theme || 'dark');
    
    // Сохраняем исходные настройки для сброса
    this.originalSettings = JSON.parse(JSON.stringify(settings));
  }
  
  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }
  
  setupTheme() {
    this.elements.themeSelect.addEventListener('change', (e) => {
      this.applyTheme(e.target.value);
    });
  }
  
  setupAutoSave() {
    // Автосохранение при изменении настроек внешнего вида
    const appearanceElements = [
      this.elements.themeSelect,
      this.elements.viewModeSelect,
      this.elements.fontSizeSelect,
      this.elements.animationsCheckbox
    ];
    
    appearanceElements.forEach(element => {
      element.addEventListener('change', () => {
        this.saveAppearanceSettings();
      });
    });
    
    // Автосохранение фильтров
    const filterElements = [
      this.elements.defaultQuality,
      this.elements.defaultDubbing,
      this.elements.defaultLanguage
    ];
    
    filterElements.forEach(element => {
      element.addEventListener('change', () => {
        this.saveFilterSettings();
      });
    });
    
    // Автосохранение источников
    this.elements.sourceCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.saveFilterSettings();
      });
    });
  }
  
  async saveAppearanceSettings() {
    const settings = await this.storage.getSettings();
    
    settings.appearance = {
      theme: this.elements.themeSelect.value,
      view: this.elements.viewModeSelect.value,
      fontSize: this.elements.fontSizeSelect.value,
      animations: this.elements.animationsCheckbox.checked
    };
    
    await this.storage.saveSettings(settings);
    this.showToast('Настройки внешнего вида сохранены');
  }
  
  async saveFilterSettings() {
    const settings = await this.storage.getSettings();
    
    const enabledSources = Array.from(this.elements.sourceCheckboxes)
      .filter(checkbox => checkbox.checked)
      .map(checkbox => checkbox.value);
    
    settings.filters = {
      quality: this.elements.defaultQuality.value,
      dubbing: this.elements.defaultDubbing.value,
      language: this.elements.defaultLanguage.value,
      sources: enabledSources
    };
    
    await this.storage.saveSettings(settings);
    this.showToast('Настройки фильтров сохранены');
  }
  
  async saveSettings() {
    const settings = await this.storage.getSettings();
    
    // Общие настройки
    settings.behavior = {
      autoSearch: this.elements.autoSearchCheckbox.checked,
      saveHistory: this.elements.saveHistoryCheckbox.checked,
      showNotifications: this.elements.showNotificationsCheckbox.checked,
      notificationSound: this.elements.notificationSoundCheckbox.checked,
      autoPlay: this.elements.autoPlayCheckbox.checked
    };
    
    // Внешний вид
    settings.appearance = {
      theme: this.elements.themeSelect.value,
      view: this.elements.viewModeSelect.value,
      fontSize: this.elements.fontSizeSelect.value,
      animations: this.elements.animationsCheckbox.checked
    };
    
    // Фильтры
    const enabledSources = Array.from(this.elements.sourceCheckboxes)
      .filter(checkbox => checkbox.checked)
      .map(checkbox => checkbox.value);
    
    settings.filters = {
      quality: this.elements.defaultQuality.value,
      dubbing: this.elements.defaultDubbing.value,
      language: this.elements.defaultLanguage.value,
      sources: enabledSources
    };
    
    // Конфиденциальность
    settings.privacy = {
      analytics: this.elements.analyticsCheckbox.checked,
      telemetry: this.elements.telemetryCheckbox.checked
    };
    
    await this.storage.saveSettings(settings);
    this.originalSettings = JSON.parse(JSON.stringify(settings));
    
    this.showToast('Все настройки сохранены');
  }
  
  async resetToSaved() {
    if (!this.originalSettings) return;
    
    // Восстанавливаем исходные настройки
    await this.storage.saveSettings(this.originalSettings);
    await this.loadSettings();
    
    this.showToast('Настройки сброшены к последнему сохранению');
  }
  
  async resetToDefaults() {
    if (!confirm('Вы уверены? Все настройки будут сброшены к значениям по умолчанию.')) {
      return;
    }
    
    await this.storage.saveSettings(Constants.DEFAULT_SETTINGS);
    await this.loadSettings();
    
    this.showToast('Настройки сброшены к значениям по умолчанию');
  }
  
  async clearHistory() {
    if (!confirm('Вы уверены? Вся история поиска будет удалена.')) {
      return;
    }
    
    await this.storage.clearSearchHistory();
    this.showToast('История поиска очищена');
  }
  
  async clearCache() {
    if (!confirm('Вы уверены? Весь кэш будет очищен.')) {
      return;
    }
    
    // Очищаем кэш расширения
    await this.storage.clearCache();
    
    // Также отправляем сообщение в background script для очистки API кэша
    chrome.runtime.sendMessage({ action: 'CLEAR_CACHE' });
    
    this.showToast('Кэш очищен');
  }
  
  async exportData() {
    const data = {
      settings: await this.storage.getSettings(),
      favorites: await this.storage.getFavorites(),
      history: await this.storage.getSearchHistory(),
      exportDate: new Date().toISOString(),
      version: Constants.VERSION
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `video-finder-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    this.showToast('Данные экспортированы');
  }
  
  async importData() {
    this.elements.importFile.click();
  }
  
  async handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!confirm('Вы уверены? Текущие данные будут заменены импортированными.')) {
      event.target.value = '';
      return;
    }
    
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Проверяем структуру данных
      if (!data.settings || !data.version) {
        throw new Error('Некорректный формат файла');
      }
      
      // Сохраняем данные
      if (data.settings) await this.storage.saveSettings(data.settings);
      if (data.favorites) await this.storage.set('favorites', data.favorites);
      if (data.history) await this.storage.set('searchHistory', data.history);
      
      // Перезагружаем настройки
      await this.loadSettings();
      
      this.showToast('Данные успешно импортированы');
    } catch (error) {
      console.error('Ошибка импорта:', error);
      alert('Ошибка при импорте данных. Проверьте формат файла.');
    }
    
    event.target.value = '';
  }
  
  async requestNotifications() {
    const granted = await this.notifications.requestPermission();
    
    if (granted) {
      this.showToast('Разрешение на уведомления получено');
    } else {
      this.showToast('Разрешение на уведомления отклонено');
    }
  }
  
  async testNotification() {
    await this.notifications.show('Video Finder: Тестовое уведомление', {
      body: 'Это тестовое уведомление. Если вы его видите, уведомления работают правильно.',
      icon: '/assets/icons/icon128.png'
    });
  }
  
  openDocumentation() {
    chrome.tabs.create({ url: 'https://github.com/yourusername/video-finder/docs' });
  }
  
  reportIssue() {
    chrome.tabs.create({ 
      url: 'https://github.com/yourusername/video-finder/issues/new' 
    });
  }
  
  rateExtension() {
    chrome.tabs.create({ 
      url: 'https://chrome.google.com/webstore/detail/video-finder/reviews' 
    });
  }
  
  showToast(message, type = 'success') {
    // Создаем toast-уведомление
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 12px 24px;
      background: ${type === 'success' ? '#4CAF50' : '#f44336'};
      color: white;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    // Автоудаление через 3 секунды
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
    
    // CSS анимации
    if (!document.getElementById('toast-animations')) {
      const style = document.createElement('style');
      style.id = 'toast-animations';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  new OptionsPage();
});