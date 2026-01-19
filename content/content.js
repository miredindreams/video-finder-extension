class PageAnalyzer {
    constructor() {
        this.init();
    }

    init() {
        this.setupMessageListener();
        this.injectUIElements();
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'GET_MOVIE_INFO') {
                const movieInfo = this.extractMovieInfo();
                sendResponse({
                    success: !!movieInfo.title,
                    data: movieInfo
                });
            }
            return true;
        });
    }

    extractMovieInfo() {
        let movieInfo = {};
        const url = window.location.href;

        // Для Кинопоиска
        if (url.includes('kinopoisk.ru') || url.includes('kinopoisk.dev')) {
            movieInfo = this.parseKinopoisk();
        }
        // Для IMDb
        else if (url.includes('imdb.com')) {
            movieInfo = this.parseIMDb();
        }
        // Для MyAnimeList
        else if (url.includes('myanimelist.net')) {
            movieInfo = this.parseMyAnimeList();
        }

        return movieInfo;
    }

    parseKinopoisk() {
        const movieInfo = {};
        
        try {
            // Попробуем найти данные в JSON-LD
            const jsonLd = document.querySelector('script[type="application/ld+json"]');
            if (jsonLd) {
                try {
                    const data = JSON.parse(jsonLd.textContent);
                    if (data.name) movieInfo.title = data.name;
                    if (data.dateCreated) movieInfo.year = new Date(data.dateCreated).getFullYear();
                    if (data.image) movieInfo.poster = data.image;
                    if (data.aggregateRating) {
                        movieInfo.rating = data.aggregateRating.ratingValue;
                    }
                } catch (e) { /* Игнорируем ошибки парсинга JSON */ }
            }

            // Если JSON-LD не сработал, парсим DOM
            if (!movieInfo.title) {
                // Название
                const titleElement = document.querySelector('h1') || 
                                     document.querySelector('.styles_title') ||
                                     document.querySelector('[data-testid="hero-title-block__title"]');
                if (titleElement) {
                    movieInfo.title = titleElement.textContent.trim();
                }

                // Год
                const yearElement = document.querySelector('a[href*="/year/"]') ||
                                   document.querySelector('.styles_year') ||
                                   document.querySelector('[data-testid="hero-title-block__metadata"]');
                if (yearElement) {
                    const yearMatch = yearElement.textContent.match(/\b(19|20)\d{2}\b/);
                    if (yearMatch) movieInfo.year = yearMatch[0];
                }

                // Постер
                const posterElement = document.querySelector('img[alt*="постер"]') ||
                                     document.querySelector('.film-poster img') ||
                                     document.querySelector('[data-testid="hero-media__poster"] img');
                if (posterElement) {
                    movieInfo.poster = posterElement.src;
                }

                // Рейтинг
                const ratingElement = document.querySelector('.film-rating-value') ||
                                     document.querySelector('[data-testid="hero-rating-bar__aggregate-rating"]');
                if (ratingElement) {
                    movieInfo.rating = ratingElement.textContent.trim();
                }

                // Определяем тип (фильм или сериал)
                const breadcrumbs = document.querySelectorAll('.breadcrumbs__item');
                const pageTitle = document.title.toLowerCase();
                if (pageTitle.includes('сериал') || pageTitle.includes('сезон') || 
                    Array.from(breadcrumbs).some(b => b.textContent.toLowerCase().includes('сериал'))) {
                    movieInfo.type = 'series';
                } else {
                    movieInfo.type = 'movie';
                }
            }
        } catch (error) {
            console.error('Ошибка парсинга Кинопоиска:', error);
        }

        return movieInfo;
    }

    parseIMDb() {
        const movieInfo = {};
        
        try {
            // Название
            const titleElement = document.querySelector('h1') ||
                                document.querySelector('[data-testid="hero-title-block__title"]');
            if (titleElement) {
                movieInfo.title = titleElement.textContent.trim();
            }

            // Год
            const yearElement = document.querySelector('[data-testid="hero-title-block__metadata"]') ||
                               document.querySelector('.sc-8c396aa2-2');
            if (yearElement) {
                const yearMatch = yearElement.textContent.match(/\b(19|20)\d{2}\b/);
                if (yearMatch) movieInfo.year = yearMatch[0];
            }

            // Постер
            const posterElement = document.querySelector('img[alt*="Poster"]') ||
                                 document.querySelector('[data-testid="hero-media__poster"] img');
            if (posterElement) {
                movieInfo.poster = posterElement.src;
            }

            // Рейтинг
            const ratingElement = document.querySelector('[data-testid="hero-rating-bar__aggregate-rating"]') ||
                                 document.querySelector('.sc-7ab21ed2-1');
            if (ratingElement) {
                movieInfo.rating = ratingElement.textContent.trim();
            }

            // Тип
            const url = window.location.href;
            movieInfo.type = url.includes('/title/tt') ? 'movie' : 
                           url.includes('/tv/') ? 'series' : 'unknown';
            
        } catch (error) {
            console.error('Ошибка парсинга IMDb:', error);
        }

        return movieInfo;
    }

    parseMyAnimeList() {
        const movieInfo = {};
        
        try {
            // Название
            const titleElement = document.querySelector('h1.title-name') ||
                                document.querySelector('.h1-title');
            if (titleElement) {
                movieInfo.title = titleElement.textContent.trim();
            }

            // Год
            const yearElement = document.querySelector('span[itemprop="startDate"]');
            if (yearElement) {
                const yearMatch = yearElement.textContent.match(/\b(19|20)\d{2}\b/);
                if (yearMatch) movieInfo.year = yearMatch[0];
            }

            // Постер
            const posterElement = document.querySelector('img[itemprop="image"]');
            if (posterElement) {
                movieInfo.poster = posterElement.src;
            }

            // Рейтинг
            const ratingElement = document.querySelector('[itemprop="ratingValue"]');
            if (ratingElement) {
                movieInfo.rating = ratingElement.textContent.trim();
            }

            // Тип (аниме)
            movieInfo.type = 'anime';
            
        } catch (error) {
            console.error('Ошибка парсинга MyAnimeList:', error);
        }

        return movieInfo;
    }

    injectUIElements() {
        // Добавляем кнопку на страницу
        this.addFinderButton();
    }

    addFinderButton() {
        // Проверяем, не добавлена ли кнопка уже
        if (document.getElementById('video-finder-button')) return;

        const button = document.createElement('button');
        button.id = 'video-finder-button';
        button.innerHTML = '<i class="fas fa-search"></i> Найти варианты';
        button.title = 'Найти альтернативные источники просмотра';

        // Стили кнопки
        button.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, #4a6fa5, #6b8cbc);
            color: white;
            border: none;
            border-radius: 25px;
            padding: 12px 20px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            z-index: 9999;
            box-shadow: 0 4px 15px rgba(74, 111, 165, 0.3);
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s ease;
        `;

        button.onmouseenter = () => {
            button.style.transform = 'translateY(-2px)';
            button.style.boxShadow = '0 6px 20px rgba(74, 111, 165, 0.5)';
        };

        button.onmouseleave = () => {
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = '0 4px 15px rgba(74, 111, 165, 0.3)';
        };

        button.onclick = () => {
            // Открываем popup расширения
            chrome.runtime.sendMessage({ action: 'OPEN_POPUP' });
        };

        document.body.appendChild(button);
    }
}

// Запускаем анализатор страницы
new PageAnalyzer();