class Notifications {
  constructor() {
    this.permissionGranted = false;
    this.checkPermission();
  }
  
  // Проверка разрешения на уведомления
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
  
  // Запрос разрешения
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
  
  // Показ уведомления
  async show(title, options = {}) {
    // Проверяем настройки пользователя
    const settings = await this.getSettings();
    if (!settings.showNotifications) {
      return null;
    }
    
    // Проверяем разрешение
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
      
      // Обработчик клика по уведомлению
      notification.onclick = () => {
        window.focus();
        notification.close();
        
        if (options.onClick) {
          options.onClick();
        }
      };
      
      // Автоматическое закрытие через 5 секунд
      if (!notificationOptions.requireInteraction) {
        setTimeout(() => notification.close(), 5000);
      }
      
      return notification;
    } catch (error) {
      console.error('Ошибка показа уведомления:', error);
      
      // Fallback: показываем alert
      if (settings.fallbackAlerts) {
        alert(title);
      }
      
      return null;
    }
  }
  
  // Уведомление о найденных источниках
  async showSearchResults(movieTitle, count) {
    return this.show('Video Finder: Найдены варианты', {
      body: `Для "${movieTitle}" найдено ${count} вариантов просмотра`,
      icon: '/assets/icons/icon128.png',
      badge: '/assets/icons/icon48.png',
      tag: 'search-results',
      data: { movieTitle, count }
    });
  }
  
  // Уведомление об ошибке
  async showError(message) {
    return this.show('Video Finder: Ошибка', {
      body: message,
      icon: '/assets/icons/icon128.png',
      tag: 'error',
      requireInteraction: true
    });
  }
  
  // Уведомление о копировании ссылки
  async showCopiedNotification() {
    return this.show('Ссылка скопирована', {
      body: 'Ссылка успешно скопирована в буфер обмена',
      icon: '/assets/icons/icon128.png',
      tag: 'copied'
    });
  }
  
  // Уведомление об обновлении
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
  
  // Уведомление о сетевом статусе
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
  
  // Получение настроек уведомлений
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
  
  // Сохранение настроек уведомлений
  async saveSettings(settings) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ notificationSettings: settings }, () => {
        resolve();
      });
    });
  }
  
  // Проверка поддержки браузером
  static isSupported() {
    return 'Notification' in window && 
           'serviceWorker' in navigator &&
           'PushManager' in window;
  }
  
  // Подписка на push-уведомления
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
  
  // Вспомогательная функция для конвертации ключа
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

// Экспортируем синглтон
const notifications = new Notifications();
export default notifications;