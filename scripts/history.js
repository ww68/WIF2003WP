const API_KEY = '9a56291f8d522c5f874ed7812f062758';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/w500';
const historyContainer = document.getElementById('history-sections');
const emptyState = document.getElementById('empty-state');

const historyIds = JSON.parse(localStorage.getItem('watchHistory')) || [];

async function getMovieDetails(movieId) {
  const response = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}`);
  return response.json();
}
function createHistorySection(label, movieIds) {
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

function createHistoryMovieCard(movie) {
    const movieItem = document.createElement('div');
    movieItem.classList.add('history-movie-item');
    movieItem.setAttribute('movie-id', movie.id);
    
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
        removeFromHistory(movie.id);
        movieItem.remove();
        checkEmptyState();
    });
    
    return movieItem;
}

async function loadHistory() {
    const history = JSON.parse(localStorage.getItem('watchHistory')) || [];

    if (history.length === 0) {
        emptyState.classList.remove('d-none');
        return;
    }

    const grouped = {};
    let lastId = null;

    // Group by date and remove duplicates
    for (const entry of history) {
        if (entry.id === lastId) continue;
        lastId = entry.id;

        const label = getDateLabel(entry.timestamp);
        if (!grouped[label]) grouped[label] = [];
        grouped[label].push(entry.id);
    }

    // Create sections and movie cards
    for (const [label, movieIds] of Object.entries(grouped)) {
        const sectionId = createHistorySection(label, movieIds);
        const container = document.getElementById(sectionId);
        
        for (const id of movieIds) {
            try {
                const movie = await getMovieDetails(id);
                const card = createHistoryMovieCard(movie);
                container.appendChild(card);
            } catch (err) {
                console.error(`Failed to fetch movie ${id}`, err);
            }
        }
    }
}

function saveToHistory(movieId) {
    let history = JSON.parse(localStorage.getItem('watchHistory')) || [];
    const entry = {
        id: movieId,
        timestamp: new Date().toISOString()
    };
    history.unshift(entry); // Add to front
    localStorage.setItem('watchHistory', JSON.stringify(history));
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

function removeFromHistory(movieId) {
  let history = JSON.parse(localStorage.getItem('watchHistory')) || [];
  history = history.filter(entry => entry.id !== movieId);
  localStorage.setItem('watchHistory', JSON.stringify(history));
}

function checkEmptyState() {
  const cardsLeft = document.querySelectorAll('#history-container .col-md-3');
  if (cardsLeft.length === 0) {
    emptyState.classList.remove('d-none');
  }
}

document.getElementById('clear-history').addEventListener('click', () => {
  if (confirm('Are you sure you want to delete all watch history?')) {
    localStorage.removeItem('watchHistory');
    historyContainer.innerHTML = '';
    emptyState.classList.remove('d-none');
  }
});

// Add this to handle the watch functionality
function watchMovie(movieId) {
    saveToHistory(movieId);
    window.location.href = `movie.html?id=${movieId}`;
}

// Initialize the page
loadHistory();

// Clear history button
document.getElementById('clear-history').addEventListener('click', () => {
    if (confirm('Are you sure you want to delete all watch history?')) {
        localStorage.removeItem('watchHistory');
        historyContainer.innerHTML = '';
        emptyState.classList.remove('d-none');
    }
});

  


  
