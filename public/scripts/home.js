const API_KEY = '9a56291f8d522c5f874ed7812f062758';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/w500';

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
        const poster = movie.poster_path ? `${IMAGE_URL}${movie.poster_path}` : 'movie-website-master/img/placeholder.jpg';
        const movieItem = document.createElement('div');
        movieItem.classList.add('movie-list-item');
        movieItem.setAttribute('movie-id', String(movie.id));
        movieItem.innerHTML = `
            <div class="bookmark-wrapper">
                <div class="bookmark-circle d-flex align-items-center justify-content-center">
                    <i class="fa-solid fa-bookmark bookmark-icon"></i>
                </div>
            </div>
            <img class="movie-list-item-img" src="${poster}" alt="${movie.title}">
            <span class="movie-list-item-title">${movie.title}</span>
            <p class="movie-list-item-desc">${movie.overview}</p>
            <button class="movie-list-item-button" onclick="watchMovie(${movie.id})">Watch</button>
        `;
        container.appendChild(movieItem);
    });

    attachWatchlistListeners(container);
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


// Function to toggle the watchlist status
async function toggleWatchlist(iconElement, movieId, movieData) {
    try {
        // Check if user is logged in
        if (!isLoggedIn) {
            alert('Please log in to add to watchlist');
            return;
        }

        const response = await fetch(`/watchlist/check/${movieId}`);
        const data = await response.json();
        const movieInWatchlist = data.inWatchlist;

        if (movieInWatchlist) {
            // Remove from watchlist
            const removeResponse = await fetch('/watchlist/remove', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ movieId })
            });

            if (removeResponse.ok) {
                iconElement.classList.remove('active');
                iconElement.innerHTML = '<i class="far fa-bookmark me-2"></i> Watchlist';
                showToast('Removed from Watchlist');
            }
        } else {
            // Add to watchlist
            const addResponse = await fetch('/watchlist/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ movieData })
            });

            if (addResponse.ok) {
                iconElement.classList.add('active');
                iconElement.innerHTML = '<i class="fas fa-bookmark me-2"></i> Added';
                showToast('Added to Watchlist');
            }
        }
    } catch (error) {
        console.error('Error toggling watchlist:', error);
        showToast('Error toggling watchlist');
    }
}

async function updateWatchlistButtons() {
    // Check for watchlist status and update button state
    const movieId = document.getElementById('bookmarkBtn').getAttribute('data-movie-id');
    const response = await fetch(`/watchlist/check/${movieId}`);
    const data = await response.json();

    if (data.inWatchlist) {
        document.getElementById('bookmarkBtn').classList.add('active');
        document.getElementById('bookmarkBtn').innerHTML = '<i class="fas fa-bookmark me-2"></i> Added';
    }
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

async function watchMovie(movieId) {
    const movieTitle = document.querySelector(`.movie-list-item[movie-id="${movieId}"] .movie-list-item-title`).textContent;

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

