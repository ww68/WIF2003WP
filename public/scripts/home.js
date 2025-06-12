const API_KEY = '9a56291f8d522c5f874ed7812f062758';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/w500';

class OptimisticWatchlist {
    constructor() {
        this.pendingOperations = new Map(); // movieId -> {type, promise, timestamp}
    }
    
    async toggleWatchlist(movieData, iconElement) {
        const movieId = movieData.id;
        
        // Prevent multiple operations on same movie
        if (this.pendingOperations.has(movieId)) {
            console.log('Operation already in progress for movie:', movieId);
            return;
        }
        
        const isCurrentlyInWatchlist = iconElement.classList.contains('fa-solid');
        const isAdd = !isCurrentlyInWatchlist;
        
        // Update UI immediately (optimistic)
        this.updateUI(iconElement, isAdd);
        
        // Create and track operation
        const operation = this.performServerOperation(movieData, isAdd);
        this.pendingOperations.set(movieId, {
            type: isAdd ? 'add' : 'remove',
            promise: operation,
            timestamp: Date.now()
        });
        
        try {
            const result = await operation;
            
            if (!result || !result.success) {
                // Server operation failed, revert UI
                this.updateUI(iconElement, !isAdd);
                this.showError(isAdd ? 'Failed to add to watchlist' : 'Failed to remove from watchlist');
            }
            
            return result;
        } catch (error) {
            // Network error, revert UI
            this.updateUI(iconElement, !isAdd);
            this.showError('Network error. Please try again.');
            console.error('Watchlist operation error:', error);
        } finally {
            // Clean up pending operation
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        
        if (response.status === 401) {
            location.href = '/login.html';
            return null;
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

// Create global instance
const watchlistManager = new OptimisticWatchlist();

// Load movies when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    fetchMovies('movie/popular', 'top-trending');
    fetchMovies('movie/upcoming', 'new-releases');
    fetchAndDisplayAllGenres();
    // Load both carousels
    loadCarouselMovies('heroCarousel', 'carousel-content', 'movie/now_playing');
    loadCarouselMovies('heroCarousel1', 'carousel-content-1', 'trending/movie/week');
});

// Fetch movies from TMDB
function fetchMovies(endpoint, containerId) {
    fetch(`${BASE_URL}/${endpoint}?api_key=${API_KEY}&language=en-US&page=1`)
        .then(response => response.json())
        .then(data => {
            const movies = data.results.slice(0, 10); // Only top 10
            displayMovies(movies, containerId);
        })
        .catch(error => console.error('Fetch error:', error));
}

// Movie Fetch by Genre
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

// Fetch all category
async function fetchAndDisplayAllGenres() {
    const genreResponse = await fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=en-US`);
    const genreData = await genreResponse.json();
    const genres = genreData.genres;

    for (const genre of genres) {
        await fetchMoviesByGenre(genre.id, createGenreSection(genre.name, genre.id));
    }
}

function createGenreSection(genreName, genreId) {
    const container = document.createElement('div');
    container.classList.add('page-black');

    const genreIdSanitized = `genre-${genreId}`; // unique ID

    container.innerHTML = `
        <div class="movie-list-container">
            <h1 class="movie-list-title">${genreName}</h1>
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


// Render movie cards
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
        <span class="movie-list-item-title">${movieData.title}</span>
        <p class="movie-list-item-desc">${movieData.description}</p>
        <button class="movie-list-item-button" data-movie-id="${movieData.id}">Watch</button>
        `;
        container.appendChild(movieItem);

        const circle = movieItem.querySelector('.bookmark-circle');   
        const icon = circle.querySelector('.bookmark-icon');

        // Check initial state from server
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

        // SIMPLIFIED click handler - just call the manager
        circle.addEventListener('click', async () => {
            await watchlistManager.toggleWatchlist(movieData, icon);
        });

        const watchButton = movieItem.querySelector('.movie-list-item-button');
        watchButton.addEventListener('click', () => {
            watchMovie(movieData.id, movieData.title);   
        });
    });

    initializeScrolling();
}

function loadCarouselMovies(carouselId, contentId, endpoint) {
    fetch(`${BASE_URL}/${endpoint}?api_key=${API_KEY}&language=en-US&page=1`)
        .then(res => res.json())
        .then(data => {
            const slides = data.results.slice(0, 3); // Show 3 slides
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

            // Add event listeners to the "Watch Now" buttons
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

// Toast message
function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

// Enable arrow scroll for movie sections
function initializeScrolling() {
    // For each movie-list wrapper, wire up its own left+right arrows
    document.querySelectorAll('.movie-list-wrapper').forEach(wrapper => {
        const movieList = wrapper.querySelector('.movie-list');
        const items = movieList.querySelectorAll('.movie-list-item');
        let offset = 0;
        const cardWidth = 300; // or whatever your step is

        // right arrow
        wrapper.querySelector('.right-arrow').addEventListener('click', () => {
            const maxShift = Math.max(0, items.length * cardWidth - wrapper.clientWidth);
            offset = Math.min(offset + cardWidth, maxShift);
            movieList.style.transform = `translateX(-${offset}px)`;
        });

        // left arrow
            wrapper.querySelector('.left-arrow').addEventListener('click', () => {
            offset = Math.max(offset - cardWidth, 0);
            movieList.style.transform = `translateX(-${offset}px)`;
        });
    });
}

async function watchMovie(movieId, movieTitle = null) {
    window.location.href = `/movie/${movieId}`;
    
    if (!movieTitle) {
        const titleEl = document.querySelector(
            `.movie-list-item[data-id="${movieId}"] .movie-list-item-title`
        );
        movieTitle = titleEl ? titleEl.textContent : '';
    }

    // Send request to add to watch history
    fetch('/watchHistory/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ movieId: movieId, title: movieTitle }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === 'Movie added to watch history') {
            // Redirect to the movie detail page after adding to history
            window.location.href = `/movie/${movieId}`;
        } else {
            alert('Error adding movie to history');
        }
    })
    .catch(error => {
        console.error('Error adding to watch history:', error);
        alert('Error adding to history');
    });
}

