// Парсер для IMDb
class IMDbParser {
  constructor() {
    this.name = 'imdb';
    this.selectors = {
      movieTitle: 'h1',
      movieYear: '[data-testid="hero-title-block__metadata"]',
      movieRating: '[data-testid="hero-rating-bar__aggregate-rating"]',
      moviePoster: '[data-testid="hero-media__poster"] img',
      movieDescription: '[data-testid="plot"] span',
      movieGenres: '[data-testid="genres"]',
      movieDuration: '[data-testid="title-techspec_runtime"]',
      movieDirectors: 'li[data-testid="title-pc-principal-credit"]:first-child a',
      movieCast: 'a[data-testid="title-cast-item__actor"]'
    };
    
    this.init();
  }
  
  init() {
    if (this.isMoviePage()) {
      this.injectUI();
      this.sendMovieData();
    }
  }
  
  isMoviePage() {
    return window.location.pathname.includes('/title/tt');
  }
  
  parse() {
    try {
      const movieInfo = {
        title: this.getTitle(),
        year: this.getYear(),
        imdbId: this.getIMDbId(),
        posterUrl: this.getPosterUrl(),
        rating: this.getRating(),
        description: this.getDescription(),
        duration: this.getDuration(),
        directors: this.getDirectors(),
        cast: this.getCast(),
        type: this.getType(),
        source: this.name,
        url: window.location.href
      };
      
      return {
        success: true,
        data: movieInfo
      };
    } catch (error) {
      console.error('Ошибка парсинга IMDb:', error);
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
  
  getYear() {
    const element = document.querySelector(this.selectors.movieYear);
    if (element) {
      const yearMatch = element.textContent.match(/\b(19|20)\d{2}\b/);
      return yearMatch ? parseInt(yearMatch[0]) : null;
    }
    return null;
  }
  
  getIMDbId() {
    const match = window.location.pathname.match(/\/title\/(tt\d+)/);
    return match ? match[1] : null;
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
  
  getDuration() {
    const element = document.querySelector(this.selectors.movieDuration);
    if (element) {
      const text = element.textContent.trim();
      const minutesMatch = text.match(/(\d+)\s*min/);
      return minutesMatch ? parseInt(minutesMatch[1]) : null;
    }
    return null;
  }
  
  getDirectors() {
    const elements = document.querySelectorAll(this.selectors.movieDirectors);
    return Array.from(elements).map(el => el.textContent.trim());
  }
  
  getCast() {
    const elements = document.querySelectorAll(this.selectors.movieCast);
    return Array.from(elements).slice(0, 10).map(el => el.textContent.trim());
  }
  
  getType() {
    // IMDb не показывает тип явно, но можно определить по URL
    const url = window.location.href.toLowerCase();
    if (url.includes('/tv/')) {
      return 'series';
    }
    return 'movie';
  }
  
  injectUI() {
    // Добавляем кнопку Video Finder на страницу IMDb
    if (document.getElementById('video-finder-button')) return;
    
    const button = document.createElement('button');
    button.id = 'video-finder-button';
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
      </svg>
      <span>Найти варианты</span>
    `;
    
    button.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: linear-gradient(135deg, #f5c518, #e6b400);
      color: #000;
      border: none;
      border-radius: 20px;
      padding: 10px 16px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      z-index: 9999;
      box-shadow: 0 4px 12px rgba(245, 197, 24, 0.3);
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.3s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    `;
    
    button.onmouseenter = () => {
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 6px 20px rgba(245, 197, 24, 0.5)';
    };
    
    button.onmouseleave = () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 4px 12px rgba(245, 197, 24, 0.3)';
    };
    
    button.onclick = () => {
      chrome.runtime.sendMessage({
        action: 'OPEN_POPUP',
        data: this.parse().data
      });
    };
    
    document.body.appendChild(button);
  }
  
  sendMovieData() {
    const movieData = this.parse();
    
    if (movieData.success) {
      // Отправляем данные в background script
      chrome.runtime.sendMessage({
        action: 'MOVIE_PARSED',
        data: movieData.data
      });
      
      // Также сохраняем в localStorage для быстрого доступа
      localStorage.setItem('video-finder-current-movie', JSON.stringify(movieData.data));
    }
  }
  
  // Автоматический запуск при изменениях на странице
  observeChanges() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          this.sendMovieData();
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }
}

// Автоматический запуск парсера
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new IMDbParser();
  });
} else {
  new IMDbParser();
}

// Экспорт для использования в content.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = IMDbParser;
}