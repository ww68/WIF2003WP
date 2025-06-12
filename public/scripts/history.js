const API_KEY = '9a56291f8d522c5f874ed7812f062758';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/w500';
const historyContainer = document.getElementById('history-sections');
const emptyState = document.getElementById('empty-state');

async function getMovieDetails(movieId) {
    const response = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}`);
    return response.json();
}

function createHistorySection(label) {
    const section = document.createElement('div');
    section.classList.add('page-black');
    const sectionId = `history-${label.replace(/\s+/g, '-').toLowerCase()}`;
    
    section.innerHTML = `
        <div class="movie-list-container">
            <h1 class="movie-list-title">${label}</h1>
            <div class="history-movie-grid" id="${sectionId}"></div>
        </div>
    `;
    
    historyContainer.appendChild(section);
    return sectionId;
}

function createHistoryMovieCard(movie, timestamp) {
    const movieItem = document.createElement('div');
    movieItem.classList.add('history-movie-item');
    movieItem.setAttribute('movie-id', movie.id);
    movieItem.setAttribute('data-timestamp', timestamp);
    
    movieItem.innerHTML = `
        <div class="history-poster-wrapper">
            <img class="history-movie-poster" src="${IMAGE_URL + movie.poster_path}" alt="${movie.title}">
            <div class="history-movie-overlay">
                <div class="history-movie-actions">
                    <i class="bi bi-x-lg history-delete-icon"></i>
                </div>
                <div class="history-movie-info">
                    <span class="history-movie-title">${movie.title}</span>
                    <p class="history-movie-meta">${movie.release_date.split('-')[0]} | ${movie.genres.slice(0, 2).map(g => g.name).join(', ')}</p>
                    <button class="history-watch-button" onclick="watchMovie(${movie.id})">Watch Again</button>
                </div>
            </div>
        </div>
    `;
    
    // Add delete functionality
    const deleteBtn = movieItem.querySelector('.history-delete-icon');
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeFromHistory(movie.id, timestamp);
        movieItem.remove();
        checkEmptyState();
    });
    
    return movieItem;
}

async function loadHistory() {
    const response = await fetch(`/history/getHistory`);
    const history = await response.json();

    if (history.length === 0) {
        emptyState.classList.remove('d-none');
        return;
    }

    // Group by date
    const grouped = {};
    let lastMovieId = null;
    history.forEach(entry => {
        if (entry.movieId === lastMovieId) return; // skip consecutive duplicates
        lastMovieId = entry.movieId;

        const dateLabel = getDateLabel(entry.timestamp);
        if (!grouped[dateLabel]) grouped[dateLabel] = [];
        grouped[dateLabel].push(entry);
    });

    // Display grouped history
    Object.keys(grouped).forEach(label => { 
        const sectionId = createHistorySection(label, grouped[label]);
        const container = document.getElementById(sectionId);

        grouped[label].forEach(entry => {
            getMovieDetails(entry.movieId).then(movieData => {
                const movieCard = createHistoryMovieCard(movieData, entry.timestamp);
                container.appendChild(movieCard);
            });
        });
    });

}

async function saveToHistory(movieId) {
    const movieTitle = document.querySelector(`.movie-list-item[movie-id="${movieId}"] .movie-list-item-title`).textContent;
    const timestamp = new Date().toISOString();

    try {
        const response = await fetch('/history/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ movieId: movieId, title: movieTitle, timestamp }),
        });

        const data = await response.json();

        if (data.message === 'Movie added to watch history') {
            console.log('Movie successfully added to history');
        } else {
            console.log('Error adding movie to history');
        }
    } catch (error) {
        console.error('Error adding movie to history:', error);
    }
}
  
function getDateLabel(dateStr) {
    const watchDate = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isSameDay = (d1, d2) =>
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear();

    if (isSameDay(watchDate, today)) return 'Today';
    if (isSameDay(watchDate, yesterday)) return 'Yesterday';

    const diffTime = today - watchDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 7) {
    return watchDate.toLocaleDateString('en-US', { weekday: 'long' });
    }

    return watchDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }); // e.g., "2 May"
}

async function removeFromHistory(movieId, timestamp) {
    try {
        const response = await fetch('/history/remove', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ movieId, timestamp }),
        });

        const data = await response.json();

        if (data.message === 'Movie removed from history') {
            console.log('Movie successfully removed from history');
        } else {
            console.log('Error removing movie from history');
        }
    } catch (error) {
        console.error('Error removing movie from history:', error);
    }
}


function checkEmptyState() {
    const cardsLeft = document.querySelectorAll('.history-movie-item');
    if (cardsLeft.length === 0) {
        emptyState.classList.remove('d-none');
    } else {
        emptyState.classList.add('d-none');
    }
}

document.getElementById('clear-history').addEventListener('click', () => {
    if (confirm('Are you sure you want to delete all watch history?')) {
        fetch('/history/clear', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                if (data.message === 'History cleared') {
                    historyContainer.innerHTML = '';
                    checkEmptyState();
                }
            });
    }
});

function watchMovie(movieId) {
    window.location.href = `/movie/${movieId}`;
}

// Initialize the page
loadHistory();