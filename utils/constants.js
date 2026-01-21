export const Constants = {
  // Версия расширения
  VERSION: '1.0.0',
  
  // URL API
  API_URL: process.env.API_URL || 'https://video-finder.filess.io',
  
  // Ключ API (для продакшена должен быть в env)
  API_KEY: process.env.API_KEY || 'demo-key',
  
  // Поддерживаемые сайты
  SUPPORTED_SITES: {
    KINOPOISK: [
      'kinopoisk.ru',
      'kinopoisk.dev'
    ],
    IMDB: [
      'imdb.com'
    ],
    MYANIMELIST: [
      'myanimelist.net'
    ],
    ANIDUB: [
      'anidub.com',
      'anidub.tv'
    ],
    ANIMEJOY: [
      'animejoy.ru'
    ]
  },
  
  // Качество видео
  QUALITY_OPTIONS: [
    { value: '', label: 'Любое' },
    { value: '480', label: 'SD (480p)' },
    { value: '720', label: 'HD (720p)' },
    { value: '1080', label: 'FullHD (1080p)' },
    { value: '2160', label: '4K (2160p)' }
  ],
  
  // Типы озвучки
  DUBBING_OPTIONS: [
    { value: '', label: 'Любая' },
    { value: 'original', label: 'Оригинал' },
    { value: 'professional', label: 'Профессиональная' },
    { value: 'amateur', label: 'Любительская' },
    { value: 'subtitles', label: 'Субтитры' }
  ],
  
  // Языки
  LANGUAGE_OPTIONS: [
    { value: 'ru', label: 'Русский' },
    { value: 'en', label: 'Английский' },
    { value: 'jp', label: 'Японский' },
    { value: 'multi', label: 'Мультиязычный' }
  ],
  
  // Источники
  SOURCE_OPTIONS: [
    { value: 'filmix', label: 'Filmix', icon: '🎬' },
    { value: 'hdrezka', label: 'HDRezka', icon: '🎥' },
    { value: 'kinopub', label: 'KinoPub', icon: '🍿' },
    { value: 'anidub', label: 'AniDub', icon: '🇯🇵' },
    { value: 'animejoy', label: 'AnimeJoy', icon: '🌸' }
  ],
  
  // Типы контента
  CONTENT_TYPES: [
    { value: '', label: 'Все типы' },
    { value: 'movie', label: 'Фильмы' },
    { value: 'series', label: 'Сериалы' },
    { value: 'anime', label: 'Аниме' },
    { value: 'cartoon', label: 'Мультфильмы' }
  ],
  
  // Коды клавиш
  KEY_CODES: {
    ENTER: 13,
    ESCAPE: 27,
    SPACE: 32,
    ARROW_UP: 38,
    ARROW_DOWN: 40
  },
  
  // Лимиты
  LIMITS: {
    SEARCH_HISTORY: 50,
    FAVORITES: 100,
    CACHE_SIZE: 100,
    SUGGESTIONS: 10
  },
  
  // Сообщения об ошибках
  ERROR_MESSAGES: {
    NO_INTERNET: 'Нет соединения с интернетом',
    SERVER_ERROR: 'Ошибка сервера',
    NOT_FOUND: 'Ничего не найдено',
    INVALID_API_KEY: 'Неверный API ключ',
    RATE_LIMIT: 'Слишком много запросов',
    PARSE_ERROR: 'Ошибка при обработке страницы'
  },
  
  // Сообщения об успехе
  SUCCESS_MESSAGES: {
    COPIED: 'Ссылка скопирована',
    SAVED: 'Сохранено',
    ADDED_TO_FAVORITES: 'Добавлено в избранное',
    REMOVED_FROM_FAVORITES: 'Удалено из избранного'
  },
  
  // Цвета для качества
  QUALITY_COLORS: {
    '480': '#FFD166', // Желтый
    '720': '#06D6A0', // Зеленый
    '1080': '#118AB2', // Синий
    '2160': '#EF476F'  // Красный
  },
  
  // Иконки для типов контента
  TYPE_ICONS: {
    'movie': '🎬',
    'series': '📺',
    'anime': '🇯🇵',
    'cartoon': '🐰'
  },
  
  // Дефолтные настройки
  DEFAULT_SETTINGS: {
    filters: {
      quality: '720',
      dubbing: 'original',
      language: 'ru',
      sources: ['filmix', 'hdrezka', 'kinopub']
    },
    appearance: {
      theme: 'dark',
      view: 'grid',
      fontSize: 'medium',
      animations: true
    },
    behavior: {
      autoSearch: true,
      showNotifications: true,
      saveHistory: true,
      autoPlay: false
    },
    privacy: {
      analytics: false,
      telemetry: false
    }
  },
  
  // Кэш TTL (в миллисекундах)
  CACHE_TTL: {
    SEARCH: 5 * 60 * 1000,      // 5 минут
    MOVIE_INFO: 30 * 60 * 1000, // 30 минут
    SUGGESTIONS: 1 * 60 * 1000  // 1 минута
  }
};

export default Constants;