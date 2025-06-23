const API_KEY = '9a56291f8d522c5f874ed7812f062758';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/w500';

class OptimisticWatchlist {
    constructor() {
        this.pendingOperations = new Map();
    }
    
    async toggleWatchlist(movieData, iconElement) {
        const movieId = movieData.id;
        
        if (this.pendingOperations.has(movieId)) {
            console.log('Operation already in progress for movie:', movieId);
            return;
        }
        
        const isCurrentlyInWatchlist = iconElement.classList.contains('fa-solid');
        const isAdd = !isCurrentlyInWatchlist;
        
        this.updateUI(iconElement, isAdd);
        
        const operation = this.performServerOperation(movieData, isAdd);
        this.pendingOperations.set(movieId, {
            type: isAdd ? 'add' : 'remove',
            promise: operation,
            timestamp: Date.now()
        });
        
        try {
            const result = await operation;
            
            if (!result || !result.success) {
                this.updateUI(iconElement, !isAdd);
                this.showError(isAdd ? 'Failed to add to watchlist' : 'Failed to remove from watchlist');
            }
            
            return result;
        } catch (error) {
            this.updateUI(iconElement, !isAdd);
            this.showError('Network error. Please try again.');
            console.error('Watchlist operation error:', error);
        } finally {
            this.pendingOperations.delete(movieId);
        }
    }
    
    updateUI(iconElement, isAdd) {
        if (isAdd) {
            iconElement.classList.replace('fa-regular', 'fa-solid');
            iconElement.classList.add('active');
        } else {
            iconElement.classList.replace('fa-solid', 'fa-regular');
            iconElement.classList.remove('active');
        }
    }
    
    async performServerOperation(movieData, isAdd) {
        const url = isAdd ? '/watchlist/add' : '/watchlist/remove';
        const body = isAdd ? movieData : { movieId: movieData.id };
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include',
            redirect: 'manual',
            body: JSON.stringify(body)
        });
        
        if (response.status === 401) {
            promptLogin('Please log in to update your watchlist.');
            return { success: false };
        }
        
        return response.json();
    }
    
    showError(message) {
        if (typeof showToast === 'function') {
            showToast(message);
        } else {
            console.error(message);
        }
    }
}

// Global variables
const watchlistManager = new OptimisticWatchlist();
let userPreferences = null;
let userCountry = null;
let isAuthenticated = false;

// Load movies when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication and load preferences
    await checkAuthAndLoadPreferences();
    
    // Load carousels first (these are always shown)
    loadCarouselMovies('heroCarousel', 'carousel-content', 'movie/now_playing');
    loadCarouselMovies('heroCarousel1', 'carousel-content-1', 'trending/movie/week');
    
    fetchMovies('movie/popular', 'top-trending');
    fetchMovies('movie/upcoming', 'new-releases');
    
    // Load content based on user preferences
    await loadPersonalizedContent();
});

// Check if user is authenticated and load their preferences
async function checkAuthAndLoadPreferences() {
    try {
        const response = await fetch('/index/getPreferences');
        if (response.status === 200) {
            const data = await response.json();
            isAuthenticated = true;
            userPreferences = data.preferences || [];
            userCountry = data.country || null; // Get user's country
            console.log('User preferences loaded:', userPreferences);
            console.log('User country:', userCountry);
        } else {
            isAuthenticated = false;
            userPreferences = null;
            userCountry = null;
            console.log('User not authenticated or no preferences found');
        }
    } catch (error) {
        console.error('Error checking authentication:', error);
        isAuthenticated = false;
        userPreferences = null;
        userCountry = null;
    }
}

// Load personalized content based on user preferences
async function loadPersonalizedContent() {
    if (isAuthenticated && userPreferences && userPreferences.length > 0) {
        // Show personalized content
        await loadPersonalizedSections();
        showPersonalizationMessage(true);
    } else {
        await fetchAndDisplayAllGenres();
        showPersonalizationMessage(false);
    }
}

// Load personalized sections for authenticated users with preferences
async function loadPersonalizedSections() {
    // First, show "Recommended for You" section with mixed genres
    await createRecommendedSection();
    
    // Add country-specific section if user has a country
    if (userCountry) {
        await createCountrySection();
    }

    // Then show preferred genre sections
    const genreResponse = await fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=en-US`);
    const genreData = await genreResponse.json();
    const allGenres = genreData.genres;
    
    // Filter genres based on user preferences
    const preferredGenres = allGenres.filter(genre => 
        userPreferences.includes(genre.name) || userPreferences.includes(genre.id.toString())
    );
    
    // Load preferred genres first
    for (const genre of preferredGenres) {
        await fetchMoviesByGenre(genre.id, createGenreSection(genre.name, genre.id, true));
    }
    
    // Add a "Discover More" section with other popular genres
    const otherGenres = allGenres.filter(genre => 
        !userPreferences.includes(genre.name) && !userPreferences.includes(genre.id.toString())
    );
    
    if (otherGenres.length > 0) {
        createDiscoverMoreHeader();
        for (const genre of otherGenres) {
            await fetchMoviesByGenre(genre.id, createGenreSection(genre.name, genre.id, false));
        }
    }
}

// Create country-specific movie section
async function createCountrySection() {
    const countryCode = getCountryCode(userCountry);
    if (!countryCode) {
        console.log('Country code not found for:', userCountry);
        return;
    }
    
    const containerId = createCountryMovieSection(userCountry);
    await fetchMoviesByCountry(countryCode, containerId);
}

// Create country section UI
function createCountryMovieSection(countryName) {
    const container = document.createElement('div');
    container.classList.add('page-black');

    const containerId = `country-${countryName.toLowerCase().replace(/\s+/g, '-')}`;

    // Get country flag emoji
    const flagEmoji = getCountryFlag(countryName);

    container.innerHTML = `
        <div class="movie-list-container">
            <h1 class="movie-list-title">
                ${flagEmoji} Popular in ${countryName}
            </h1>
            <div class="movie-list-wrapper">
                <i class="fas fa-chevron-left arrow left-arrow"></i>
                <div class="movie-list" id="${containerId}"></div>
                <i class="fas fa-chevron-right arrow right-arrow"></i>
            </div>
        </div>
    `;

    const genreSections = document.getElementById('genre-sections');
    // Insert after recommended section if it exists, otherwise at the beginning
    const recommendedSection = genreSections.querySelector('[style*="order: -1"]');
    if (recommendedSection && recommendedSection.nextSibling) {
        genreSections.insertBefore(container, recommendedSection.nextSibling);
    } else {
        genreSections.insertBefore(container, genreSections.firstChild);
    }
    
    return containerId;
}

// Fetch movies by country
async function fetchMoviesByCountry(countryCode, containerId) {
    let allMovies = [];
    const maxPages = 3;

    for (let page = 1; page <= maxPages; page++) {
        try {
            // Try multiple approaches to get country-specific content
            const promises = [
                // Movies with production companies from the country
                fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&language=en-US&sort_by=popularity.desc&with_origin_country=${countryCode}&page=${page}`),
                // Movies with watch providers/ available in the country's streaming region
                fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&language=en-US&sort_by=popularity.desc&watch_region=${countryCode}&page=${page}`)
            ];

            // Handle and Merge the results
            const responses = await Promise.allSettled(promises);
            
            for (const response of responses) {
                if (response.status === 'fulfilled' && response.value.ok) {
                    const data = await response.value.json();
                    if (data.results && data.results.length > 0) {
                        allMovies = allMovies.concat(data.results);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching movies for country:', error);
        }
    }

    // Remove duplicates based on movie ID
    const uniqueMovies = allMovies.filter((movie, index, self) => 
        index === self.findIndex(m => m.id === movie.id)
    );

    // If we don't have enough country-specific movies, fall back to popular movies as backup
    if (uniqueMovies.length < 10) {
        try {
            const fallbackResponse = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=en-US&page=1`);
            const fallbackData = await fallbackResponse.json();
            const additionalMovies = fallbackData.results.slice(0, 20 - uniqueMovies.length);
            uniqueMovies.push(...additionalMovies);
        } catch (error) {
            console.error('Error fetching fallback movies:', error);
        }
    }

    // Shuffle and limit results
    const finalMovies = shuffleArray(uniqueMovies).slice(0, 20);
    displayMovies(finalMovies, containerId);
}

// Get country code from country name
function getCountryCode(countryName) {
    const countryMap = {
        'United States': 'US',
        'United Kingdom': 'GB',
        'Canada': 'CA',
        'Australia': 'AU',
        'Germany': 'DE',
        'France': 'FR',
        'Spain': 'ES',
        'Italy': 'IT',
        'Japan': 'JP',
        'South Korea': 'KR',
        'China': 'CN',
        'India': 'IN',
        'Brazil': 'BR',
        'Mexico': 'MX',
        'Russia': 'RU',
        'Netherlands': 'NL',
        'Sweden': 'SE',
        'Norway': 'NO',
        'Denmark': 'DK',
        'Finland': 'FI',
        'Belgium': 'BE',
        'Switzerland': 'CH',
        'Austria': 'AT',
        'Poland': 'PL',
        'Czech Republic': 'CZ',
        'Hungary': 'HU',
        'Portugal': 'PT',
        'Greece': 'GR',
        'Turkey': 'TR',
        'Israel': 'IL',
        'South Africa': 'ZA',
        'Argentina': 'AR',
        'Chile': 'CL',
        'Colombia': 'CO',
        'Thailand': 'TH',
        'Malaysia': 'MY',
        'Singapore': 'SG',
        'Indonesia': 'ID',
        'Philippines': 'PH',
        'Vietnam': 'VN',
        'Taiwan': 'TW',
        'Hong Kong': 'HK',
        'New Zealand': 'NZ',
        'Ireland': 'IE',
        'Romania': 'RO',
        'Bulgaria': 'BG',
        'Croatia': 'HR',
        'Serbia': 'RS',
        'Ukraine': 'UA',
        'Egypt': 'EG',
        'Morocco': 'MA',
        'Nigeria': 'NG',
        'Kenya': 'KE'
    };
    
    return countryMap[countryName] || null;
}

// Get country flag emoji
function getCountryFlag(countryName) {
    const flagMap = {
        'United States': '🇺🇸',
        'United Kingdom': '🇬🇧',
        'Canada': '🇨🇦',
        'Australia': '🇦🇺',
        'Germany': '🇩🇪',
        'France': '🇫🇷',
        'Spain': '🇪🇸',
        'Italy': '🇮🇹',
        'Japan': '🇯🇵',
        'South Korea': '🇰🇷',
        'China': '🇨🇳',
        'India': '🇮🇳',
        'Brazil': '🇧🇷',
        'Mexico': '🇲🇽',
        'Russia': '🇷🇺',
        'Netherlands': '🇳🇱',
        'Sweden': '🇸🇪',
        'Norway': '🇳🇴',
        'Denmark': '🇩🇰',
        'Finland': '🇫🇮',
        'Belgium': '🇧🇪',
        'Switzerland': '🇨🇭',
        'Austria': '🇦🇹',
        'Poland': '🇵🇱',
        'Czech Republic': '🇨🇿',
        'Hungary': '🇭🇺',
        'Portugal': '🇵🇹',
        'Greece': '🇬🇷',
        'Turkey': '🇹🇷',
        'Israel': '🇮🇱',
        'South Africa': '🇿🇦',
        'Argentina': '🇦🇷',
        'Chile': '🇨🇱',
        'Colombia': '🇨🇴',
        'Thailand': '🇹🇭',
        'Malaysia': '🇲🇾',
        'Singapore': '🇸🇬',
        'Indonesia': '🇮🇩',
        'Philippines': '🇵🇭',
        'Vietnam': '🇻🇳',
        'Taiwan': '🇹🇼',
        'Hong Kong': '🇭🇰',
        'New Zealand': '🇳🇿',
        'Ireland': '🇮🇪',
        'Romania': '🇷🇴',
        'Bulgaria': '🇧🇬',
        'Croatia': '🇭🇷',
        'Serbia': '🇷🇸',
        'Ukraine': '🇺🇦',
        'Egypt': '🇪🇬',
        'Morocco': '🇲🇦',
        'Nigeria': '🇳🇬',
        'Kenya': '🇰🇪'
    };
    
    return flagMap[countryName] || '🌍';
}

// Create "Recommended for You" section mixing preferred genres
async function createRecommendedSection() {
    const genreResponse = await fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=en-US`);
    const genreData = await genreResponse.json();
    const allGenres = genreData.genres;
    
    // Get genre IDs from user preferences
    const preferredGenreIds = [];
    userPreferences.forEach(pref => {
        const genre = allGenres.find(g => g.name === pref || g.id.toString() === pref);
        if (genre) {
            preferredGenreIds.push(genre.id);
        }
    });
    
    if (preferredGenreIds.length > 0) {
        const containerId = createRecommendedForYouSection();
        await fetchMoviesByMultipleGenres(preferredGenreIds, containerId);
    }
}

// Fetch movies from multiple genres for recommendations
async function fetchMoviesByMultipleGenres(genreIds, containerId) {
    let allMovies = [];
    const maxPages = 3;
    const genreString = genreIds.join(',');

    for (let page = 1; page <= maxPages; page++) {
        try {
            const res = await fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&language=en-US&sort_by=popularity.desc&with_genres=${genreString}&page=${page}`);
            const data = await res.json();
            allMovies = allMovies.concat(data.results);
        } catch (error) {
            console.error('Error fetching movies for multiple genres:', error);
            break;
        }
    }

    // Shuffle and limit results
    allMovies = shuffleArray(allMovies).slice(0, 20);
    displayMovies(allMovies, containerId);
}

// Create "Recommended for You" section
function createRecommendedForYouSection() {
    const container = document.createElement('div');
    container.classList.add('page-black');
    container.style.order = '-1'; // Show at the top

    const containerId = 'recommended-for-you';

    container.innerHTML = `
        <div class="movie-list-container">
            <h1 class="movie-list-title">
                <i class="fas fa-star me-2"></i>Recommended for You
            </h1>
            <div class="movie-list-wrapper">
                <i class="fas fa-chevron-left arrow left-arrow"></i>
                <div class="movie-list" id="${containerId}"></div>
                <i class="fas fa-chevron-right arrow right-arrow"></i>
            </div>
        </div>
    `;

    const genreSections = document.getElementById('genre-sections');
    genreSections.insertBefore(container, genreSections.firstChild);
    return containerId;
}

// Create "Discover More" header
function createDiscoverMoreHeader() {
    const header = document.createElement('div');
    header.classList.add('page-black');
    header.innerHTML = `
        <div class="movie-list-container">
            <h2 class="movie-list-title text-muted">
                <i class="fas fa-compass me-2"></i>Discover More
            </h2>
        </div>
    `;
    document.getElementById('genre-sections').appendChild(header);
}

// Enhanced genre section creation with preference indication
function createGenreSection(genreName, genreId, isPreferred = false) {
    const container = document.createElement('div');
    container.classList.add('page-black');

    const genreIdSanitized = `genre-${genreId}`;
    const preferredIcon = isPreferred ? '' : '';

    container.innerHTML = `
        <div class="movie-list-container">
            <h1 class="movie-list-title">${preferredIcon}${genreName}</h1>
            <div class="movie-list-wrapper">
                <i class="fas fa-chevron-left arrow left-arrow"></i>
                <div class="movie-list" id="${genreIdSanitized}"></div>
                <i class="fas fa-chevron-right arrow right-arrow"></i>
            </div>
        </div>
    `;

    document.getElementById('genre-sections').appendChild(container);
    return genreIdSanitized;
}

// Show personalization message
function showPersonalizationMessage(hasPreferences) {
    const banner = document.getElementById('personalization-banner');
    if (!banner) return;

    if (!isAuthenticated) {
        banner.innerHTML = `
            <div class="alert alert-primary alert-dismissible fade show" role="alert">
                <i class="fas fa-lock me-2"></i>
                <strong>You're missing out!</strong> 
                <a href="/login" class="alert-link">Log in</a> or 
                <a href="/signup" class="alert-link">Sign up</a> to get personalized movie recommendations.
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
    } else if (hasPreferences) {
        banner.innerHTML = `
            <div class="alert alert-info alert-dismissible fade show" role="alert">
                <i class="fas fa-magic me-2"></i>
                <strong>Personalized for you!</strong> We're showing content based on your genre preferences.
                <a href="/profile#genre-preferences-section" class="alert-link">Update preferences</a>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
    } else {
        banner.innerHTML = `
            <div class="alert alert-warning alert-dismissible fade show" role="alert">
                <i class="fas fa-user-cog me-2"></i>
                <strong>Get personalized recommendations!</strong> 
                <a href="/profile#genre-preferences-section" class="alert-link">Set your genre preferences</a>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
    }
}

// Utility function to shuffle array
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Existing functions (keeping them as they are)
function fetchMovies(endpoint, containerId) {
    fetch(`${BASE_URL}/${endpoint}?api_key=${API_KEY}&language=en-US&page=1`)
        .then(response => response.json())
        .then(data => {
            const movies = data.results.slice(0, 10);
            displayMovies(movies, containerId);
        })
        .catch(error => console.error('Fetch error:', error));
}

async function fetchMoviesByGenre(genreId, containerId) {
    let allMovies = [];
    const maxPages = 5;

    for (let page = 1; page <= maxPages; page++) {
        const res = await fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&language=en-US&sort_by=popularity.desc&with_genres=${genreId}&page=${page}`);
        const data = await res.json();
        allMovies = allMovies.concat(data.results);
    }

    displayMovies(allMovies, containerId);
}

async function fetchAndDisplayAllGenres() {
    const genreResponse = await fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=en-US`);
    const genreData = await genreResponse.json();
    const genres = genreData.genres;

    for (const genre of genres) {
        await fetchMoviesByGenre(genre.id, createGenreSection(genre.name, genre.id));
    }
}

function displayMovies(movies, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    movies.forEach(movie => {
        const movieData = {
            id: String(movie.id),
            title: movie.title,
            year: (movie.release_date || '').split('-')[0],
            rating: movie.vote_average?.toFixed(1) || 'N/A',
            description: movie.overview,
            img: movie.poster_path ? `${IMAGE_URL}${movie.poster_path}` : '/images/fallback.png',
            watched: false
        };

        const movieItem = document.createElement('div');
        movieItem.className = 'movie-list-item';
        movieItem.dataset.id = movieData.id;
        movieItem.innerHTML = `
        <div class="bookmark-wrapper">
            <div class="bookmark-circle d-flex align-items-center justify-content-center">
                <i class="fa-regular fa-bookmark bookmark-icon"></i>
            </div>
        </div>
        <img class="movie-list-item-img" src="${movieData.img}" alt="${movieData.title}">
        <div class="movie-info-container">
            <div class="movie-list-item-title">${movieData.title}</div>
            <div class="movie-list-item-desc">${movieData.description}</div>
        </div>
        <button class="movie-list-item-button" data-movie-id="${movieData.id}">Watch</button>
        `;
        container.appendChild(movieItem);

        const circle = movieItem.querySelector('.bookmark-circle');   
        const icon = circle.querySelector('.bookmark-icon');

        // Check initial state from server (only for authenticated users)
        if (isAuthenticated) {
            fetch(`/watchlist/check/${movieData.id}`)
                .then(r => r.status === 401 ? null : r.json())
                .then(data => {
                    if (data?.inWatchlist) {
                        icon.classList.replace('fa-regular', 'fa-solid');
                        icon.classList.add('active');
                    }
                })
                .catch(() => {
                    // Ignore errors for initial state check
                });
        }

        circle.addEventListener('click', async () => {
            if (!isAuthenticated) {
                promptLogin('Please log in to add movies to your watchlist.');
                return;
            }
            await watchlistManager.toggleWatchlist(movieData, icon);
        });

        const watchButton = movieItem.querySelector('.movie-list-item-button');
        watchButton.addEventListener('click', () => {
            watchMovie(movieData.id);   
        });
    });

    initializeScrolling();
}

function loadCarouselMovies(carouselId, contentId, endpoint) {
    fetch(`${BASE_URL}/${endpoint}?api_key=${API_KEY}&language=en-US&page=1`)
        .then(res => res.json())
        .then(data => {
            const slides = data.results.slice(0, 3);
            const carouselInner = document.getElementById(contentId);
            if (!carouselInner) return;

            carouselInner.innerHTML = '';
            slides.forEach((movie, index) => {
                const bgImg = movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : 'movie-website-master/img/placeholder.jpg';
                const activeClass = index === 0 ? 'active' : '';
                carouselInner.innerHTML += `
                    <div class="carousel-item ${activeClass} hero-slide" style="background-image: url('${bgImg}')">
                        <div class="carousel-caption text-start">
                            <h1 class="fw-bold">${movie.title}</h1>
                            <p>${movie.overview}</p>
                            <a href="#" onclick="event.preventDefault(); watchMovie(${movie.id})" class="btn btn-primary btn-lg watch-now-btn" data-movie-id="${movie.id}">
                                <i class="fas fa-play me-2"></i>Watch Now
                            </a>
                        </div>
                    </div>
                `;
            });

            const watchNowButtons = document.querySelectorAll('.watch-now-btn');
            watchNowButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const movieId = button.getAttribute('data-movie-id');
                    watchMovie(movieId);
                });
            });
        })
        .catch(err => console.error(`Error loading ${carouselId}:`, err));
}

function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

function initializeScrolling() {
    document.querySelectorAll('.movie-list-wrapper').forEach(wrapper => {
        const movieList = wrapper.querySelector('.movie-list');
        const items = movieList.querySelectorAll('.movie-list-item');
        let offset = 0;
        const cardWidth = 300;

        wrapper.querySelector('.right-arrow').addEventListener('click', () => {
            const maxShift = Math.max(0, items.length * cardWidth - wrapper.clientWidth);
            offset = Math.min(offset + cardWidth, maxShift);
            movieList.style.transform = `translateX(-${offset}px)`;
        });

        wrapper.querySelector('.left-arrow').addEventListener('click', () => {
            offset = Math.max(offset - cardWidth, 0);
            movieList.style.transform = `translateX(-${offset}px)`;
        });
    });
}

function watchMovie(movieId) {
    window.location.href = `/movie/${movieId}`;
}

function promptLogin(msg = 'Please log in to view your watchlist.') {
  if (typeof showAuthModal === 'function') {
    showAuthModal(msg);          // dark overlay with Log-In / Cancel
  } else {
    // fallback (should never happen now)
    window.location.href = '/login';
  }
}
