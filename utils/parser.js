import Helpers from './helpers.js';

class Parser {
  static parseKinopoisk(document) {
    try {
      let title = '';
      const titleElement = document.querySelector('[data-testid="hero-title-block__title"]') ||
                         document.querySelector('h1') ||
                         document.querySelector('.styles_title');
      
      if (titleElement) {
        title = titleElement.textContent.trim();
      }
      
      let originalTitle = '';
      const originalTitleElement = document.querySelector('[data-testid="hero-title-block__original-title"]') ||
                                 document.querySelector('.styles_originalTitle');
      
      if (originalTitleElement) {
        originalTitle = originalTitleElement.textContent.trim();
      }
      
      let year = null;
      const yearElement = document.querySelector('a[href*="/lists/movies/"]') ||
                         document.querySelector('.styles_year') ||
                         document.querySelector('[data-testid="hero-title-block__metadata"]');
      
      if (yearElement) {
        const yearMatch = yearElement.textContent.match(/\b(19|20)\d{2}\b/);
        if (yearMatch) year = parseInt(yearMatch[0]);
      }
      
      let kinopoiskId = null;
      const pathMatch = window.location.pathname.match(/\/film\/(\d+)/);
      if (pathMatch) {
        kinopoiskId = parseInt(pathMatch[1]);
      }
      
      let posterUrl = '';
      const posterElement = document.querySelector('[data-testid="hero-media__poster"] img') ||
                           document.querySelector('.film-poster img') ||
                           document.querySelector('img[alt*="постер"]');
      
      if (posterElement && posterElement.src) {
        posterUrl = posterElement.src;
      }
      
      let rating = null;
      const ratingElement = document.querySelector('[data-testid="hero-rating-bar__aggregate-rating"]') ||
                           document.querySelector('.film-rating-value');
      
      if (ratingElement) {
        const ratingMatch = ratingElement.textContent.match(/[\d.]+/);
        if (ratingMatch) rating = parseFloat(ratingMatch[0]);
      }
      
      let type = 'movie';
      const url = window.location.href.toLowerCase();
      const titleText = document.title.toLowerCase();
      
      if (url.includes('/series/') || titleText.includes('сериал')) {
        type = 'series';
      }
      
      let description = '';
      const descriptionElement = document.querySelector('[data-testid="plot"] span') ||
                               document.querySelector('.styles_synopsis');
      
      if (descriptionElement) {
        description = descriptionElement.textContent.trim();
      }
      
      const genres = [];
      const genreElements = document.querySelectorAll('[data-testid="genres"] a, .styles_genres a');
      genreElements.forEach(el => {
        const genre = el.textContent.trim();
        if (genre) genres.push(genre);
      });
      
      const countries = [];
      const countryElements = document.querySelectorAll('[data-testid="country"] a, .styles_country a');
      countryElements.forEach(el => {
        const country = el.textContent.trim();
        if (country) countries.push(country);
      });

      let duration = null;
      const durationElement = document.querySelector('[data-testid="duration"]');
      if (durationElement) {
        const text = durationElement.textContent.trim();
        const hoursMatch = text.match(/(\d+)ч/);
        const minutesMatch = text.match(/(\d+)м/);
        
        const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
        const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
        
        duration = hours * 60 + minutes;
      }
      
      return {
        title,
        originalTitle,
        year,
        kinopoiskId,
        posterUrl,
        rating,
        type,
        description,
        genres,
        countries,
        duration,
        source: 'kinopoisk',
        url: window.location.href,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Ошибка парсинга Кинопоиска:', error);
      return null;
    }
  }
  
  static parseIMDb(document) {
    try {
      let title = '';
      const titleElement = document.querySelector('h1') ||
                         document.querySelector('[data-testid="hero-title-block__title"]');
      
      if (titleElement) {
        title = titleElement.textContent.trim();
      }
      
      let year = null;
      const yearElement = document.querySelector('[data-testid="hero-title-block__metadata"]') ||
                         document.querySelector('.sc-8c396aa2-2');
      
      if (yearElement) {
        const yearMatch = yearElement.textContent.match(/\b(19|20)\d{2}\b/);
        if (yearMatch) year = parseInt(yearMatch[0]);
      }
      
      let imdbId = null;
      const pathMatch = window.location.pathname.match(/\/title\/(tt\d+)/);
      if (pathMatch) {
        imdbId = pathMatch[1];
      }
      
      let posterUrl = '';
      const posterElement = document.querySelector('[data-testid="hero-media__poster"] img') ||
                           document.querySelector('img[alt*="Poster"]');
      
      if (posterElement && posterElement.src) {
        posterUrl = posterElement.src;
      }
      
      let rating = null;
      const ratingElement = document.querySelector('[data-testid="hero-rating-bar__aggregate-rating"]') ||
                           document.querySelector('.sc-7ab21ed2-1');
      
      if (ratingElement) {
        const ratingMatch = ratingElement.textContent.match(/[\d.]+/);
        if (ratingMatch) rating = parseFloat(ratingMatch[0]);
      }
      
      let type = 'movie';
      const url = window.location.href.toLowerCase();
      if (url.includes('/tv/')) {
        type = 'series';
      }
      
      let description = '';
      const descriptionElement = document.querySelector('[data-testid="plot"] span');
      if (descriptionElement) {
        description = descriptionElement.textContent.trim();
      }
      
      return {
        title,
        year,
        imdbId,
        posterUrl,
        rating,
        type,
        description,
        source: 'imdb',
        url: window.location.href,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Ошибка парсинга IMDb:', error);
      return null;
    }
  }
  
  static parseMyAnimeList(document) {
    try {
      let title = '';
      const titleElement = document.querySelector('h1.title-name') ||
                         document.querySelector('.h1-title');
      
      if (titleElement) {
        title = titleElement.textContent.trim();
      }
      
      let englishTitle = '';
      const englishTitleElement = document.querySelector('span[itemprop="alternativeHeadline"]');
      if (englishTitleElement) {
        englishTitle = englishTitleElement.textContent.trim();
      }
      
      let year = null;
      const yearElement = document.querySelector('span[itemprop="startDate"]');
      if (yearElement) {
        const yearMatch = yearElement.textContent.match(/\b(19|20)\d{2}\b/);
        if (yearMatch) year = parseInt(yearMatch[0]);
      }
      
      let posterUrl = '';
      const posterElement = document.querySelector('img[itemprop="image"]');
      if (posterElement && posterElement.src) {
        posterUrl = posterElement.src;
      }
      
      let rating = null;
      const ratingElement = document.querySelector('[itemprop="ratingValue"]');
      if (ratingElement) {
        rating = parseFloat(ratingElement.textContent.trim());
      }
      
      const type = 'anime';
      
      let description = '';
      const descriptionElement = document.querySelector('[itemprop="description"]');
      if (descriptionElement) {
        description = descriptionElement.textContent.trim();
      }
      
      const genres = [];
      const genreElements = document.querySelectorAll('span[itemprop="genre"]');
      genreElements.forEach(el => {
        const genre = el.textContent.trim();
        if (genre) genres.push(genre);
      });
      
      return {
        title,
        englishTitle,
        year,
        posterUrl,
        rating,
        type,
        description,
        genres,
        source: 'myanimelist',
        url: window.location.href,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Ошибка парсинга MyAnimeList:', error);
      return null;
    }
  }
  
  static parseCurrentPage(document) {
    const url = window.location.href.toLowerCase();
    
    if (url.includes('kinopoisk')) {
      return this.parseKinopoisk(document);
    } else if (url.includes('imdb.com')) {
      return this.parseIMDb(document);
    } else if (url.includes('myanimelist.net')) {
      return this.parseMyAnimeList(document);
    }
    
    return null;
  }
  
  static parseSearchResults(data) {
    if (!data || !Array.isArray(data)) {
      return [];
    }
    
    return data.map(item => ({
      id: item._id || item.id,
      title: item.title,
      originalTitle: item.originalTitle,
      year: item.year,
      type: item.type || 'movie',
      posterUrl: item.posterUrl,
      rating: item.rating,
      description: item.description,
      genres: item.genres || [],
      countries: item.countries || [],
      sources: item.sources || [],
      sourceCount: item.sources ? item.sources.length : 0
    }));
  }
  
  static filterSources(sources, filters) {
    if (!sources || !Array.isArray(sources)) {
      return [];
    }
    
    return sources.filter(source => {
      if (filters.quality && source.quality !== filters.quality) {
        return false;
      }
      
      if (filters.dubbing && source.audioType !== filters.dubbing) {
        return false;
      }
      
      if (filters.language && source.audioLanguage !== filters.language) {
        return false;
      }
      
      if (filters.sources && filters.sources.length > 0) {
        if (!filters.sources.includes(source.websiteName)) {
          return false;
        }
      }
      
      if (!source.isActive) {
        return false;
      }
      
      return true;
    });
  }
  
  static groupByQuality(sources) {
    if (!sources) return {};
    
    const groups = {};
    
    sources.forEach(source => {
      const quality = source.quality || 'unknown';
      if (!groups[quality]) {
        groups[quality] = [];
      }
      groups[quality].push(source);
    });
    
    const qualityOrder = ['2160', '1440', '1080', '720', '480', '360', 'unknown'];
    
    return Object.keys(groups)
      .sort((a, b) => {
        const indexA = qualityOrder.indexOf(a);
        const indexB = qualityOrder.indexOf(b);
        return indexA - indexB;
      })
      .reduce((acc, quality) => {
        acc[quality] = groups[quality];
        return acc;
      }, {});
  }
  
  // Сортировка источников
  static sortSources(sources, sortBy = 'quality', order = 'desc') {
    if (!sources) return [];
    
    const sorted = [...sources];
    
    sorted.sort((a, b) => {
      let valueA, valueB;
      
      switch (sortBy) {
        case 'quality':
          const qualityOrder = ['2160', '1440', '1080', '720', '480', '360', 'unknown'];
          valueA = qualityOrder.indexOf(a.quality || 'unknown');
          valueB = qualityOrder.indexOf(b.quality || 'unknown');
          break;
          
        case 'rating':
          valueA = a.rating?.score || 0;
          valueB = b.rating?.score || 0;
          break;
          
        case 'date':
          valueA = new Date(a.createdAt || 0).getTime();
          valueB = new Date(b.createdAt || 0).getTime();
          break;
          
        default:
          return 0;
      }
      
      if (order === 'desc') {
        return valueB - valueA;
      } else {
        return valueA - valueB;
      }
    });
    
    return sorted;
  }
}

export default Parser;