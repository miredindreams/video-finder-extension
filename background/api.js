const searchCache = new Map();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
        case 'SEARCH_MOVIE':
            handleMovieSearch(message.data, sendResponse);
            return true;
            
        case 'OPEN_POPUP':
            chrome.action.openPopup();
            break;
            
        case 'GET_API_KEY':
            handleApiKeyRequest(sendResponse);
            return true;
            
        case 'LOG_ERROR':
            console.error('Ошибка из content script:', message.error);
            break;
    }
});

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        initializeExtension();
    }
    createContextMenu();
});

function initializeExtension() {
    const defaultSettings = {
        filters: {
            quality: '720',
            dubbing: 'original',
            language: 'ru'
        },
        sources: ['filmix', 'hdrezka', 'kinopub'],
        autoDetect: true,
        notifications: true
    };
    
    chrome.storage.local.set({ 
        videoFinderSettings: defaultSettings,
        firstRun: true 
    });

    chrome.tabs.create({
        url: chrome.runtime.getURL('welcome.html')
    });
}

function createContextMenu() {
    chrome.contextMenus.create({
        id: 'search-movie',
        title: 'Найти варианты просмотра',
        contexts: ['selection']
    });

    chrome.contextMenus.onClicked.addListener((info, tab) => {
        if (info.menuItemId === 'search-movie') {
            chrome.storage.local.set({
                manualSearchText: info.selectionText
            }, () => {
                chrome.action.openPopup();
            });
        }
    });
}

async function handleMovieSearch(searchData, sendResponse) {
    try {
        const cacheKey = JSON.stringify(searchData);

        if (searchCache.has(cacheKey)) {
            const cachedData = searchCache.get(cacheKey);
            if (Date.now() - cachedData.timestamp < 5 * 60 * 1000) { // 5 минут
                sendResponse({ success: true, data: cachedData.results });
                return;
            }
        }

        const settings = await getSettings();

        const movieId = await findMovieId(searchData);
        
        if (!movieId) {
            sendResponse({ 
                success: false, 
                error: 'Фильм не найден в базе' 
            });
            return;
        }
        
        const sources = await findSources(movieId, searchData.filters, settings.sources);
        
        searchCache.set(cacheKey, {
            timestamp: Date.now(),
            results: sources
        });
        
        sendResponse({ success: true, data: sources });
        
    } catch (error) {
        console.error('Ошибка поиска:', error);
        sendResponse({ 
            success: false, 
            error: error.message 
        });
    }
}

async function findMovieId(searchData) {
    const { title, year } = searchData;
    
    const apis = [
        tryKinopoiskAPI,
        tryOMDbAPI,
        tryIMDbAPI
    ];
    
    for (const apiFunc of apis) {
        try {
            const id = await apiFunc(title, year);
            if (id) return id;
        } catch (error) {
            console.warn(`API ${apiFunc.name} не сработало:`, error.message);
        }
    }
    
    return null;
}

async function tryKinopoiskAPI(title, year) {
    const apiKey = await getApiKey('kinopoisk');
    if (!apiKey) return null;
    
    const url = `https://api.kinopoisk.dev/v1.2/movie/search?page=1&limit=1&query=${encodeURIComponent(title)}`;
    
    const response = await fetch(url, {
        headers: {
            'X-API-KEY': apiKey,
            'Accept': 'application/json'
        }
    });
    
    if (!response.ok) throw new Error(`Kinopoisk API error: ${response.status}`);
    
    const data = await response.json();
    
    if (data.docs && data.docs.length > 0) {
        return {
            id: data.docs[0].id,
            source: 'kinopoisk',
            type: data.docs[0].type
        };
    }
    
    return null;
}

async function tryOMDbAPI(title, year) {
    const apiKey = await getApiKey('omdb');
    if (!apiKey) return null;
    
    let url = `https://www.omdbapi.com/?apikey=${apiKey}&t=${encodeURIComponent(title)}`;
    if (year) url += `&y=${year}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.Response === 'True') {
        return {
            id: data.imdbID,
            source: 'imdb',
            type: data.Type === 'movie' ? 'movie' : 'series'
        };
    }
    
    return null;
}

async function tryIMDbAPI(title, year) {
    const apiKey = await getApiKey('imdb');
    if (!apiKey) return null;
    
    const url = `https://imdb-api.com/API/Search/${apiKey}/${encodeURIComponent(title)}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
        return {
            id: data.results[0].id,
            source: 'imdb',
            type: data.results[0].resultType === 'Title' ? 'movie' : data.results[0].resultType.toLowerCase()
        };
    }
    
    return null;
}

async function findSources(movieId, filters, enabledSources) {
    return getDemoSources(movieId, filters);
}

function getDemoSources(movieId, filters) {
    const sources = [
        {
            source: 'Filmix',
            url: `https://filmix.ac/film/${movieId.id || '12345'}`,
            quality: filters.quality || '720',
            dubbing: filters.dubbing === 'professional' ? 'Профессиональная' : 
                    filters.dubbing === 'amateur' ? 'Любительская' : 'Оригинал',
            language: filters.language === 'ru' ? 'Русский' : 
                     filters.language === 'en' ? 'Английский' : 'Мультиязычный',
            year: '2023',
            title: 'Найденный фильм',
            thumbnail: 'https://via.placeholder.com/300x200/4a6fa5/ffffff?text=Filmix',
            duration: '2ч 15м',
            rating: '8.5'
        },
        {
            source: 'HDRezka',
            url: `https://rezka.ag/films/${movieId.id || '12345'}.html`,
            quality: '1080',
            dubbing: 'Профессиональная',
            language: 'Русский',
            year: '2023',
            title: 'Найденный фильм',
            thumbnail: 'https://via.placeholder.com/300x200/ff6b6b/ffffff?text=HDRezka',
            duration: '2ч 15м',
            subtitles: true
        }
    ];
    
    if (filters.quality) {
        return sources.filter(s => s.quality === filters.quality);
    }
    
    return sources;
}

async function getApiKey(service) {
    const result = await chrome.storage.local.get(['apiKeys']);
    return result.apiKeys?.[service];
}

async function getSettings() {
    const result = await chrome.storage.local.get(['videoFinderSettings']);
    return result.videoFinderSettings || {};
}

function handleApiKeyRequest(sendResponse) {
    chrome.storage.local.get(['apiKeys'], (result) => {
        sendResponse({ keys: result.apiKeys || {} });
    });
}

setInterval(() => {
    const now = Date.now();
    for (const [key, value] of searchCache.entries()) {
        if (now - value.timestamp > 60 * 60 * 1000) { 
            searchCache.delete(key);
        }
    }
}, 60 * 60 * 1000);

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && 
        (tab.url.includes('kinopoisk') || tab.url.includes('imdb') || tab.url.includes('myanimelist'))) {

        chrome.tabs.sendMessage(tabId, {
            action: 'PAGE_UPDATED',
            url: tab.url
        }).catch(() => {
        });
    }
});