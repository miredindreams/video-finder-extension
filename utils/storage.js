class VideoFinderAPI {
    constructor() {
        this.baseURL = 'https://your-backend-api.com'; // Замените на ваш URL
        this.cache = new Map();
        this.cacheDuration = 5 * 60 * 1000; // 5 минут
    }

    async searchMovie(searchParams) {
        const cacheKey = JSON.stringify(searchParams);
        
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheDuration) {
                return cached.data;
            }
        }
        
        try {
            const response = await fetch(`${this.baseURL}/api/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Extension-Version': chrome.runtime.getManifest().version
                },
                body: JSON.stringify(searchParams)
            });
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            const data = await response.json();
            
            this.cache.set(cacheKey, {
                timestamp: Date.now(),
                data: data
            });
            
            return data;
            
        } catch (error) {
            console.error('API Error:', error);
            
            return this.getFallbackData(searchParams);
        }
    }

    async getMovieInfo(movieId, source = 'kinopoisk') {
        try {
            const response = await fetch(`${this.baseURL}/api/movie/${source}/${movieId}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching movie info:', error);
            return null;
        }
    }

    async getAvailableSources() {
        try {
            const response = await fetch(`${this.baseURL}/api/sources`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching sources:', error);
            return ['filmix', 'hdrezka', 'kinopub'];
        }
    }

    async reportBrokenLink(source, url) {
        try {
            await fetch(`${this.baseURL}/api/report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ source, url, type: 'broken' })
            });
        } catch (error) {
            console.error('Error reporting broken link:', error);
        }
    }

    async getStatistics() {
        try {
            const response = await fetch(`${this.baseURL}/api/stats`);
            return await response.json();
        } catch (error) {
            return { totalMovies: 0, totalSources: 0 };
        }
    }

    getFallbackData(searchParams) {
        return {
            success: true,
            data: [
                {
                    source: 'Filmix',
                    url: 'https://filmix.ac/film/demo',
                    quality: searchParams.filters?.quality || '720',
                    dubbing: this.mapDubbing(searchParams.filters?.dubbing),
                    language: this.mapLanguage(searchParams.filters?.language),
                    year: searchParams.year || '2023',
                    title: searchParams.title || 'Демо фильм',
                    thumbnail: 'https://via.placeholder.com/300x200/4a6fa5/ffffff?text=Filmix',
                    duration: '2ч 15м',
                    rating: '8.5'
                }
            ]
        };
    }

    mapDubbing(dubbing) {
        const map = {
            'professional': 'Профессиональная',
            'amateur': 'Любительская',
            'original': 'Оригинал',
            'subtitles': 'Субтитры'
        };
        return map[dubbing] || 'Оригинал';
    }

    mapLanguage(lang) {
        const map = {
            'ru': 'Русский',
            'en': 'Английский',
            'jp': 'Японский',
            'multi': 'Мультиязычный'
        };
        return map[lang] || 'Русский';
    }

    cleanupCache() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > this.cacheDuration) {
                this.cache.delete(key);
            }
        }
    }
}

const videoFinderAPI = new VideoFinderAPI();
setInterval(() => videoFinderAPI.cleanupCache(), 60 * 1000); // Очистка каждую минуту

export default videoFinderAPI;