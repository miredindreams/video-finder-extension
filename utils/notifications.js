class Notifications {
  constructor() {
    this.permissionGranted = false;
    this.checkPermission();
  }
  
  async checkPermission() {
    if (!('Notification' in window)) {
      console.log('Браузер не поддерживает уведомления');
      return false;
    }
    
    if (Notification.permission === 'granted') {
      this.permissionGranted = true;
      return true;
    }
    
    return false;
  }
  
  async requestPermission() {
    if (!('Notification' in window)) {
      return false;
    }
    
    try {
      const permission = await Notification.requestPermission();
      this.permissionGranted = permission === 'granted';
      return this.permissionGranted;
    } catch (error) {
      console.error('Ошибка запроса разрешения:', error);
      return false;
    }
  }
  
  async show(title, options = {}) {
    const settings = await this.getSettings();
    if (!settings.showNotifications) {
      return null;
    }
    
    if (!this.permissionGranted && !await this.requestPermission()) {
      return null;
    }
    
    const defaultOptions = {
      icon: '/assets/icons/icon128.png',
      badge: '/assets/icons/icon48.png',
      tag: 'video-finder',
      requireInteraction: false,
      silent: !settings.notificationSound
    };
    
    const notificationOptions = { ...defaultOptions, ...options };
    
    try {
      const notification = new Notification(title, notificationOptions);
      
      notification.onclick = () => {
        window.focus();
        notification.close();
        
        if (options.onClick) {
          options.onClick();
        }
      };
      
      if (!notificationOptions.requireInteraction) {
        setTimeout(() => notification.close(), 5000);
      }
      
      return notification;
    } catch (error) {
      console.error('Ошибка показа уведомления:', error);
      
      if (settings.fallbackAlerts) {
        alert(title);
      }
      
      return null;
    }
  }
  
  async showSearchResults(movieTitle, count) {
    return this.show('Video Finder: Найдены варианты', {
      body: `Для "${movieTitle}" найдено ${count} вариантов просмотра`,
      icon: '/assets/icons/icon128.png',
      badge: '/assets/icons/icon48.png',
      tag: 'search-results',
      data: { movieTitle, count }
    });
  }
  
  async showError(message) {
    return this.show('Video Finder: Ошибка', {
      body: message,
      icon: '/assets/icons/icon128.png',
      tag: 'error',
      requireInteraction: true
    });
  }
  
  async showCopiedNotification() {
    return this.show('Ссылка скопирована', {
      body: 'Ссылка успешно скопирована в буфер обмена',
      icon: '/assets/icons/icon128.png',
      tag: 'copied'
    });
  }
  
  async showUpdateNotification(version) {
    return this.show('Video Finder обновлен', {
      body: `Установлена версия ${version}. Нажмите для просмотра изменений.`,
      icon: '/assets/icons/icon128.png',
      tag: 'update',
      requireInteraction: true,
      onClick: () => {
        chrome.tabs.create({ url: `chrome://extensions/?id=${chrome.runtime.id}` });
      }
    });
  }
  
  async showNetworkStatus(isOnline) {
    if (!isOnline) {
      return this.show('Video Finder: Нет соединения', {
        body: 'Работаем в офлайн-режиме. Некоторые функции могут быть недоступны.',
        icon: '/assets/icons/icon128.png',
        tag: 'network-status',
        requireInteraction: true
      });
    }
  }
  
  async getSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['notificationSettings'], (result) => {
        const defaultSettings = {
          showNotifications: true,
          notificationSound: false,
          fallbackAlerts: true,
          types: {
            search: true,
            errors: true,
            updates: true,
            network: true
          }
        };
        
        resolve({
          ...defaultSettings,
          ...(result.notificationSettings || {})
        });
      });
    });
  }
  
  async saveSettings(settings) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ notificationSettings: settings }, () => {
        resolve();
      });
    });
  }
  
  static isSupported() {
    return 'Notification' in window && 
           'serviceWorker' in navigator &&
           'PushManager' in window;
  }
  
  async subscribeToPush() {
    if (!Notifications.isSupported()) {
      return null;
    }
    
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(process.env.VAPID_PUBLIC_KEY)
      });
      
      return subscription;
    } catch (error) {
      console.error('Ошибка подписки на push:', error);
      return null;
    }
  }
  

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  }
}

const notifications = new Notifications();
export default notifications;