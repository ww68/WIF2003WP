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
    deleteBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        
        // Call removeFromHistory and wait for the result
        const wasRemoved = await removeFromHistory(movie.id, timestamp, {
            title: movie.title,
            id: movie.id
        });
        
        // Only remove from DOM if the server deletion was successful
        if (wasRemoved) {
            movieItem.remove();
            checkEmptyState();
        }
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
    history.forEach(entry => {
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

async function removeFromHistory(movieId, timestamp, movieData = {}) {
    const confirmed = await showDeleteConfirmation(movieData);
    if (!confirmed) {
        return false; // User cancelled
    }

    try {
        const response = await fetch('/history/remove', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ movieId, timestamp }),
        });

        const data = await response.json();

        if (data.message === 'Movie removed from history') {
            console.log('Movie successfully removed from history');
            return true;
        } else {
            console.log('Error removing movie from history');
            return false;
        }
    } catch (error) {
        console.error('Error removing movie from history:', error);
        return false;
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

document.getElementById('clear-history').addEventListener('click', async () => {
    const confirmed = await showClearAllConfirmation();
    
    if (confirmed) {
        try {
            const response = await fetch('/history/clear', { method: 'POST' });
            const data = await response.json();
            
            if (data.message === 'History cleared') {
                await showSuccessModal('All history cleared successfully');

                historyContainer.innerHTML = '';
                checkEmptyState();
                console.log('All history cleared successfully');
            } else {
                console.error('Failed to clear history');
                // Optionally show an error message to user
            }
        } catch (error) {
            console.error('Error clearing history:', error);
            // Optionally show an error message to user
        }
    }
});

function watchMovie(movieId) {
    window.location.href = `/movie/${movieId}`;
}

// Generic reusable modal function
function showConfirmationModal(options = {}) {
    const {
        title = 'Confirm Action',
        message = 'Are you sure you want to proceed?',
        subMessage = 'This action cannot be undone.',
        confirmText = 'Confirm',
        cancelText = 'Cancel',
        confirmIcon = 'fas fa-check',
        warningIcon = 'fas fa-exclamation-triangle',
        confirmButtonClass = 'btn-danger',
        showWarningIcon = true
    } = options;

    return new Promise((resolve) => {
        const modalHTML = `
            <div class="delete-modal-backdrop" onclick="resolveConfirmation(false)">
                <div class="delete-modal-content" onclick="event.stopPropagation()">
                    ${showWarningIcon ? `
                        <div class="delete-icon">
                            <i class="${warningIcon}"></i>
                        </div>
                    ` : ''}
                    <h3>${title}</h3>
                    <p>${message}</p>
                    ${subMessage ? `<p><small>${subMessage}</small></p>` : ''}
                    <div class="modal-buttons">
                        <button class="${confirmButtonClass}" onclick="resolveConfirmation(true)">
                            <i class="${confirmIcon}"></i> ${confirmText}
                        </button>
                        ${cancelText ? `
                            <button class="btn-secondary" onclick="resolveConfirmation(false)">
                                ${cancelText}
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        
        const modal = document.createElement('div');
        modal.innerHTML = modalHTML;
        document.body.appendChild(modal);
        
        window.resolveConfirmation = (confirmed) => {
            document.body.removeChild(modal);
            delete window.resolveConfirmation;
            resolve(confirmed);
        };
    });
}

// Updated delete single movie function
function showDeleteConfirmation(movieData) {
    return showConfirmationModal({
        title: 'Remove from History?',
        message: `Remove "${movieData.title || 'this movie'}" from your viewing history?`,
        subMessage: 'This action cannot be undone.',
        confirmText: 'Remove',
        confirmIcon: 'fas fa-trash',
        confirmButtonClass: 'btn-danger'
    });
}

// New clear all history confirmation function
function showClearAllConfirmation() {
    return showConfirmationModal({
        title: 'Clear All History?',
        message: 'This will permanently delete your entire watch history.',
        subMessage: 'All your viewing history will be lost forever. This action cannot be undone.',
        confirmText: 'Clear All',
        confirmIcon: 'fas fa-trash-alt',
        confirmButtonClass: 'btn-danger',
        warningIcon: 'fas fa-exclamation-triangle'
    });
}

// Example usage for other confirmations (bonus)
function showSuccessModal(message) {
    return showConfirmationModal({
        title: 'Success!',
        message: message,
        subMessage: '',
        confirmText: 'OK',
        cancelText: '',
        confirmIcon: 'fas fa-check',
        warningIcon: 'fas fa-check-circle',
        confirmButtonClass: 'btn-success',
        showWarningIcon: true
    });
}

// Initialize the page
loadHistory();