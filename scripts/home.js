const API_KEY = '9a56291f8d522c5f874ed7812f062758';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/w500';

// Load movies when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    fetchMovies('movie/popular', 'top-trending');
    fetchMovies('movie/upcoming', 'new-releases');
    fetchMoviesByGenre(27, 'horror-movies'); // 27 = Horror
    fetchMoviesByGenre(35, 'comedy-movies'); // 35 = Comedy
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
function fetchMoviesByGenre(genreId, containerId) {
    fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&language=en-US&sort_by=popularity.desc&with_genres=${genreId}&page=1`)
        .then(res => res.json())
        .then(data => {
            displayMovies(data.results.slice(0, 10), containerId);
        })
        .catch(err => console.error('Genre fetch error:', err));
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
        movieItem.setAttribute('movie-id', movie.id);
        movieItem.innerHTML = `
            <div class="bookmark-wrapper">
                <div class="bookmark-circle d-flex align-items-center justify-content-center">
                    <i class="fa-solid fa-bookmark bookmark-icon"></i>
                </div>
            </div>
            <img class="movie-list-item-img" src="${poster}" alt="${movie.title}">
            <span class="movie-list-item-title">${movie.title}</span>
            <p class="movie-list-item-desc">${movie.overview}</p>
            <button class="movie-list-item-button" onclick="window.location.href='movie.html?id=${movie.id}'">Watch</button>
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
                            <a href="movie.html?id=${movie.id}" class="btn btn-primary btn-lg">
                                <i class="fas fa-play me-2"></i>Watch Now
                            </a>
                        </div>
                    </div>
                `;
            });
        })
        .catch(err => console.error(`Error loading ${carouselId}:`, err));
}

// Watchlist toggle
function toggleWatchlist(iconElement, movieId) {
    let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
    const movieItem = iconElement.closest('.movie-list-item');

    const movieData = {
        id: movieId,
        title: movieItem.querySelector('.movie-list-item-title')?.textContent || 'Unknown Title',
        year: 2025, // static placeholder
        description: movieItem.querySelector('.movie-list-item-desc')?.textContent || '',
        img: movieItem.querySelector('.movie-list-item-img')?.getAttribute('src') || '',
        rating: "7.0", // static placeholder
        watched: false
    };

    const index = watchlist.findIndex(movie => movie.id === movieId);

    if (index === -1) {
        watchlist.push(movieData);
        iconElement.classList.add('active');
        showToast('Added to Watchlist');
    } else {
        watchlist.splice(index, 1);
        iconElement.classList.remove('active');
        showToast('Removed from Watchlist');
    }

    localStorage.setItem('watchlist', JSON.stringify(watchlist));
}

// Highlight saved watchlist icons
function attachWatchlistListeners(container) {
    const items = container.querySelectorAll('.movie-list-item');
    const watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];

    items.forEach(item => {
        const movieId = item.getAttribute('movie-id');
        const icon = item.querySelector('.bookmark-icon');

        if (watchlist.find(m => m.id == movieId)) {
            icon.classList.add('active');
        }

        icon.addEventListener('click', () => toggleWatchlist(icon, movieId));
    });
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
    const arrows = document.querySelectorAll(".arrow");
    const movieLists = document.querySelectorAll(".movie-list");

    arrows.forEach((arrow, i) => {
        const movieList = movieLists[i];
        const items = movieList.querySelectorAll(".movie-list-item");
        let clickCounter = 0;

        arrow.addEventListener("click", () => {
            const ratio = Math.floor(window.innerWidth / 270);
            clickCounter++;

            if (items.length - (4 + clickCounter) + (4 - ratio) >= 0) {
                movieList.style.transform = `translateX(${
                    movieList.computedStyleMap().get("transform")[0]?.x.value - 300 || 0
                }px)`;
            } else {
                movieList.style.transform = "translateX(0)";
                clickCounter = 0;
            }
        });
    });
}
