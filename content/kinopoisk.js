// Парсер для Кинопоиска
class KinopoiskParser {
  constructor() {
    this.name = 'kinopoisk';
    this.selectors = {
      movieTitle: '[data-testid="hero-title-block__title"]',
      movieOriginalTitle: '[data-testid="hero-title-block__original-title"]',
      movieYear: 'a[href*="/lists/movies/"]',
      moviePoster: '[data-testid="hero-media__poster"] img',
      movieRating: '[data-testid="hero-rating-bar__aggregate-rating"]',
      movieDescription: '[data-testid="plot"] span',
      movieGenres: '[data-testid="genres"] a',
      movieCountries: '[data-testid="country"] a',
      movieDuration: '[data-testid="duration"]',
      movieType: 'meta[property="og:type"]'
    };
  }

  parse() {
    try {
      const movieInfo = {
        title: this.getTitle(),
        originalTitle: this.getOriginalTitle(),
        year: this.getYear(),
        kinopoiskId: this.getKinopoiskId(),
        posterUrl: this.getPosterUrl(),
        rating: this.getRating(),
        description: this.getDescription(),
        genres: this.getGenres(),
        countries: this.getCountries(),
        duration: this.getDuration(),
        type: this.getType()
      };

      // Валидация
      if (!movieInfo.title) {
        throw new Error('Название фильма не найдено');
      }

      return {
        success: true,
        data: movieInfo,
        source: this.name
      };
    } catch (error) {
      console.error('Ошибка парсинга Кинопоиска:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  getTitle() {
    const element = document.querySelector(this.selectors.movieTitle);
    return element ? element.textContent.trim() : '';
  }

  getOriginalTitle() {
    const element = document.querySelector(this.selectors.movieOriginalTitle);
    return element ? element.textContent.trim() : '';
  }

  getYear() {
    const element = document.querySelector(this.selectors.movieYear);
    if (element) {
      const yearMatch = element.textContent.match(/\b(19|20)\d{2}\b/);
      return yearMatch ? parseInt(yearMatch[0]) : null;
    }
    return null;
  }

  getKinopoiskId() {
    // Из URL: https://www.kinopoisk.ru/film/12345/
    const match = window.location.pathname.match(/\/film\/(\d+)/);
    return match ? parseInt(match[1]) : null;
  }

  getPosterUrl() {
    const element = document.querySelector(this.selectors.moviePoster);
    return element ? element.src : '';
  }

  getRating() {
    const element = document.querySelector(this.selectors.movieRating);
    if (element) {
      const ratingText = element.textContent.trim();
      const ratingMatch = ratingText.match(/[\d.]+/);
      return ratingMatch ? parseFloat(ratingMatch[0]) : null;
    }
    return null;
  }

  getDescription() {
    const element = document.querySelector(this.selectors.movieDescription);
    return element ? element.textContent.trim() : '';
  }

  getGenres() {
    const elements = document.querySelectorAll(this.selectors.movieGenres);
    return Array.from(elements).map(el => el.textContent.trim());
  }

  getCountries() {
    const elements = document.querySelectorAll(this.selectors.movieCountries);
    return Array.from(elements).map(el => el.textContent.trim());
  }

  getDuration() {
    const element = document.querySelector(this.selectors.movieDuration);
    if (element) {
      const text = element.textContent.trim();
      // Конвертация "2ч 15м" в минуты
      const hoursMatch = text.match(/(\d+)ч/);
      const minutesMatch = text.match(/(\d+)м/);
      
      const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
      const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
      
      return hours * 60 + minutes;
    }
    return null;
  }

  getType() {
    const element = document.querySelector(this.selectors.movieType);
    if (element) {
      const type = element.getAttribute('content');
      if (type.includes('video.tv_show')) return 'series';
      if (type.includes('video.movie')) return 'movie';
    }
    
    // Определение по URL или другим признакам
    if (window.location.pathname.includes('/series/')) return 'series';
    if (window.location.pathname.includes('/film/')) return 'movie';
    
    return 'movie';
  }

  // Дополнительные методы
  getActors() {
    // Можно добавить парсинг актеров
    return [];
  }

  getDirectors() {
    // Можно добавить парсинг режиссеров
    return [];
  }

  isMoviePage() {
    return window.location.pathname.includes('/film/') || 
           window.location.pathname.includes('/series/');
  }

  // Отправка данных в расширение
  sendToExtension() {
    if (this.isMoviePage()) {
      const movieData = this.parse();
      chrome.runtime.sendMessage({
        action: 'MOVIE_PARSED',
        data: movieData
      });
    }
  }
}

// Автоматический запуск при загрузке страницы
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const parser = new KinopoiskParser();
    parser.sendToExtension();
  });
} else {
  const parser = new KinopoiskParser();
  parser.sendToExtension();
}

// Экспорт для использования в content.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = KinopoiskParser;
}