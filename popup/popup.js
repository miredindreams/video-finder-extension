class VideoFinderPopup {
    constructor() {
        this.currentMovie = null;
        this.filters = {
            quality: '720',
            dubbing: 'original',
            language: 'ru'
        };
        this.init();
    }

    async init() {
        this.cacheElements();
        this.bindEvents();
        await this.loadCurrentPageMovie();
        this.loadSavedFilters();
    }

    cacheElements() {
        this.elements = {
            status: document.getElementById('status'),
            currentMovie: document.getElementById('currentMovie'),
            movieLoading: document.getElementById('movieLoading'),
            quality: document.getElementById('quality'),
            dubbing: document.getElementById('dubbing'),
            language: document.getElementById('language'),
            movieTitle: document.getElementById('movieTitle'),
            movieYear: document.getElementById('movieYear'),
            searchBtn: document.getElementById('searchBtn'),
            resultsContainer: document.getElementById('resultsContainer'),
            emptyState: document.getElementById('emptyState'),
            settingsBtn: document.getElementById('settingsBtn')
        };
    }

    bindEvents() {
        // Фильтры
        this.elements.quality.addEventListener('change', (e) => {
            this.filters.quality = e.target.value;
            this.saveFilters();
        });

        this.elements.dubbing.addEventListener('change', (e) => {
            this.filters.dubbing = e.target.value;
            this.saveFilters();
        });

        this.elements.language.addEventListener('change', (e) => {
            this.filters.language = e.target.value;
            this.saveFilters();
        });

        // Кнопка поиска
        this.elements.searchBtn.addEventListener('click', () => this.search());

        // Нажатие Enter в поле поиска
        this.elements.movieTitle.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.search();
        });

        // Кнопка настроек
        this.elements.settingsBtn.addEventListener('click', () => this.openSettings());
    }

    async loadCurrentPageMovie() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (tab.url.includes('kinopoisk') || tab.url.includes('imdb')) {
                // Запрашиваем информацию о фильме с текущей страницы
                const response = await chrome.tabs.sendMessage(tab.id, { 
                    action: 'GET_MOVIE_INFO' 
                });
                
                if (response && response.success) {
                    this.currentMovie = response.data;
                    this.displayCurrentMovie();
                    this.updateStatus('Фильм найден', 'success');
                    
                    // Заполняем поля для ручного поиска
                    if (this.currentMovie.title) {
                        this.elements.movieTitle.value = this.currentMovie.title;
                        if (this.currentMovie.year) {
                            this.elements.movieYear.value = this.currentMovie.year;
                        }
                    }
                } else {
                    this.showManualSearch();
                    this.updateStatus('Укажите фильм вручную', 'warning');
                }
            } else {
                this.showManualSearch();
                this.updateStatus('Поддерживается только Кинопоиск/IMDb', 'info');
            }
        } catch (error) {
            console.error('Ошибка при получении информации:', error);
            this.showManualSearch();
            this.updateStatus('Ошибка загрузки', 'error');
        }
    }

    displayCurrentMovie() {
        if (!this.currentMovie) return;

        this.elements.movieLoading.style.display = 'none';
        
        const movieHTML = `
            <div class="movie-info">
                ${this.currentMovie.poster ? 
                    `<img src="${this.currentMovie.poster}" alt="${this.currentMovie.title}" class="movie-poster">` : 
                    '<div class="movie-poster" style="background: #2d4059; display: flex; align-items: center; justify-content: center;"><i class="fas fa-film"></i></div>'
                }
                <div class="movie-details">
                    <h3>${this.currentMovie.title}</h3>
                    ${this.currentMovie.year ? `<p>Год: ${this.currentMovie.year}</p>` : ''}
                    ${this.currentMovie.type ? `<p>Тип: ${this.currentMovie.type === 'movie' ? 'Фильм' : 'Сериал'}</p>` : ''}
                    ${this.currentMovie.rating ? `<p>Рейтинг: ${this.currentMovie.rating}</p>` : ''}
                </div>
            </div>
        `;
        
        this.elements.currentMovie.innerHTML = movieHTML;
    }

    showManualSearch() {
        this.elements.movieLoading.style.display = 'none';
        this.elements.currentMovie.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-mouse-pointer"></i>
                <p>Перейдите на страницу фильма или введите название вручную</p>
            </div>
        `;
    }

    async search() {
        const title = this.elements.movieTitle.value.trim();
        const year = this.elements.movieYear.value.trim();
        
        if (!title) {
            this.updateStatus('Введите название фильма', 'error');
            return;
        }

        this.updateStatus('Ищем варианты...', 'loading');
        
        try {
            const searchData = {
                title,
                year: year || null,
                filters: this.filters
            };

            // Отправляем запрос к бэкенду
            const response = await this.callBackendAPI('search', searchData);
            
            if (response.success && response.data.length > 0) {
                this.displayResults(response.data);
                this.updateStatus(`Найдено ${response.data.length} вариантов`, 'success');
            } else {
                this.showNoResults();
                this.updateStatus('Варианты не найдены', 'warning');
            }
        } catch (error) {
            console.error('Ошибка поиска:', error);
            this.updateStatus('Ошибка поиска', 'error');
            
            // Для демо покажем тестовые данные
            this.displayDemoResults();
        }
    }

    async callBackendAPI(endpoint, data) {
        // Временный URL для тестирования
        const API_URL = 'https://jsonplaceholder.typicode.com/posts';
        
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    endpoint,
                    data,
                    timestamp: new Date().toISOString()
                })
            });

            return await response.json();
        } catch (error) {
            // В случае ошибки возвращаем демо-данные
            return {
                success: true,
                data: this.getDemoData()
            };
        }
    }

    getDemoData() {
        return [
            {
                source: 'Filmix',
                url: 'https://filmix.ac/film/12345',
                quality: '1080',
                dubbing: 'Профессиональная',
                language: 'Русский',
                year: '2023',
                title: 'Демонстрационный фильм',
                thumbnail: 'https://via.placeholder.com/300x200/4a6fa5/ffffff?text=Filmix',
                duration: '2ч 15м'
            },
            {
                source: 'HDRezka',
                url: 'https://rezka.ag/films/12345.html',
                quality: '720',
                dubbing: 'Оригинал',
                language: 'Английский',
                year: '2023',
                title: 'Демонстрационный фильм',
                thumbnail: 'https://via.placeholder.com/300x200/ff6b6b/ffffff?text=HDRezka',
                duration: '2ч 15м',
                subtitles: true
            },
            {
                source: 'KinoPub',
                url: 'https://kinopub.net/film/12345',
                quality: '4K',
                dubbing: 'Профессиональная',
                language: 'Русский',
                year: '2023',
                title: 'Демонстрационный фильм',
                thumbnail: 'https://via.placeholder.com/300x200/06d6a0/ffffff?text=KinoPub',
                duration: '2ч 15м',
                hdr: true
            }
        ];
    }

    displayResults(results) {
        this.elements.emptyState.style.display = 'none';
        this.elements.resultsContainer.innerHTML = '';

        const template = document.getElementById('resultTemplate');

        results.forEach(result => {
            const clone = template.content.cloneNode(true);
            const card = clone.querySelector('.result-card');

            // Заполняем данные
            card.querySelector('.source-badge').textContent = result.source;
            card.querySelector('.source-badge').setAttribute('data-source', result.source.toLowerCase());
            
            const qualityBadge = card.querySelector('.quality-badge');
            qualityBadge.textContent = `${result.quality}p`;
            qualityBadge.setAttribute('data-quality', result.quality);
            
            // Цвета для качества
            const qualityColors = {
                '480': '#ffd166',
                '720': '#06d6a0',
                '1080': '#118ab2',
                '2160': '#ef476f'
            };
            qualityBadge.style.background = qualityColors[result.quality] || '#06d6a0';
            
            card.querySelector('.thumbnail').src = result.thumbnail;
            card.querySelector('.thumbnail').alt = result.title;
            card.querySelector('.result-title').textContent = result.title;
            card.querySelector('.dubbing').textContent = result.dubbing;
            card.querySelector('.language').textContent = result.language;
            card.querySelector('.year').textContent = result.year;

            // Кнопки действий
            const visitBtn = card.querySelector('.btn-visit');
            const copyBtn = card.querySelector('.btn-copy');
            const playBtn = card.querySelector('.play-btn');

            visitBtn.addEventListener('click', () => {
                chrome.tabs.create({ url: result.url });
            });

            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(result.url)
                    .then(() => {
                        this.showNotification('Ссылка скопирована!');
                    })
                    .catch(err => {
                        console.error('Ошибка копирования:', err);
                    });
            });

            playBtn.addEventListener('click', () => {
                chrome.tabs.create({ url: result.url });
            });

            this.elements.resultsContainer.appendChild(card);
        });
    }

    displayDemoResults() {
        const demoData = this.getDemoData();
        this.displayResults(demoData);
        this.updateStatus('Демо-результаты', 'info');
    }

    showNoResults() {
        this.elements.resultsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <p>По вашему запросу ничего не найдено</p>
                <p style="font-size: 12px; margin-top: 10px;">Попробуйте изменить фильтры</p>
            </div>
        `;
    }

    updateStatus(message, type = 'info') {
        const status = this.elements.status;
        status.textContent = message;
        
        status.className = 'status';
        status.classList.add(`status-${type}`);
        
        // Цвета статусов
        const colors = {
            success: '#06d6a0',
            error: '#ef476f',
            warning: '#ffd166',
            info: '#4a6fa5',
            loading: '#6b8cbc'
        };
        
        status.style.color = colors[type] || '#ffd166';
        
        // Автоскрытие
        if (type !== 'loading') {
            setTimeout(() => {
                status.textContent = 'Готово';
                status.style.color = '#6b8cbc';
            }, 3000);
        }
    }

    saveFilters() {
        chrome.storage.local.set({ 
            videoFinderFilters: this.filters 
        });
    }

    loadSavedFilters() {
        chrome.storage.local.get(['videoFinderFilters'], (result) => {
            if (result.videoFinderFilters) {
                this.filters = result.videoFinderFilters;
                
                // Устанавливаем значения в селектах
                if (this.filters.quality) {
                    this.elements.quality.value = this.filters.quality;
                }
                if (this.filters.dubbing) {
                    this.elements.dubbing.value = this.filters.dubbing;
                }
                if (this.filters.language) {
                    this.elements.language.value = this.filters.language;
                }
            }
        });
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--success-color);
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }

    openSettings() {
        // В будущем можно добавить настройки
        this.updateStatus('Настройки в разработке', 'info');
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new VideoFinderPopup();
});