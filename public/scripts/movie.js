// movie-client.js - Client-side JavaScript for movie details page
const IMAGE_URL = 'https://image.tmdb.org/t/p/w500';

let selectedRating = 0;

document.addEventListener('DOMContentLoaded', function () {
    // Initialize the page
    setupBookmarkButton();
    setupSimilarMoviesButtons();
    setupReviewForm();
    updateWatchlistButtons();

    // Set up star rating system
    const ratingDisplay = document.getElementById('rating-number');
    const stars = document.querySelectorAll('.star');

    if (stars.length > 0) {
        stars.forEach(star => {
            star.addEventListener('click', () => {
                selectedRating = parseInt(star.dataset.value);
                stars.forEach(s => s.classList.remove('selected'));
                for (let i = 0; i < selectedRating; i++) {
                    stars[i].classList.add('selected');
                }
                if (ratingDisplay) {
                    ratingDisplay.textContent = selectedRating.toFixed(1);
                }
            });
        });
    }

    // Load reviews
    const movieIdInput = document.getElementById('movie-id');
    if (movieIdInput) {
        const movieId = movieIdInput.value;
        loadReviews(movieId);
    }

    // Add to history if movie data exists
    if (window.movieData && window.movieData.id) {
        addToHistory(window.movieData.id, window.movieData.title);
    }
});

// Update rating number
function updateRatingNumber(rating) {
    const ratingDisplay = document.getElementById('rating-number');
    if (ratingDisplay) {
        ratingDisplay.textContent = rating.toFixed(1);
    }
}

// Setup review form
function setupReviewForm() {
    const reviewForm = document.getElementById('review-form');
    if (!reviewForm) return;

    reviewForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const movieId = document.getElementById('movie-id').value;
        const text = document.getElementById('comment').value.trim();

        if (selectedRating === 0 || text === '') {
            alert('Please provide a rating and review text.');
            return;
        }

        const success = await saveReview(movieId, selectedRating, text);
        if (success) {
            await loadReviews(movieId);

            // Reset the form and star rating
            reviewForm.reset();
            selectedRating = 0;
            document.querySelectorAll('.star').forEach(s => s.classList.remove('selected'));
            updateRatingNumber(0);
        }
    });
}

// Save review to MongoDB
async function saveReview(movieId, rating, reviewText) {
    try {
        const res = await fetch('/reviews', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ movieId, rating, text: reviewText })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to submit review');

        alert('Review submitted!');
        return true;
    } catch (err) {
        console.error('Error saving review:', err);
        alert(err.message || 'Something went wrong.');
        return false;
    }
}

// Load reviews from server
async function loadReviews(movieId) {
    const reviewList = document.getElementById('review-list');
    const commentCount = document.getElementById('comment-count');

    if (!reviewList || !commentCount) return;

    try {
        const res = await fetch(`/reviews/${movieId}`);
        const data = await res.json();
        const reviews = data.reviews || [];

        // Update comment count
        if (reviews.length === 0) {
            commentCount.textContent = 'No comments yet';
        } else if (reviews.length === 1) {
            commentCount.textContent = '1 comment has been posted';
        } else {
            commentCount.textContent = `${reviews.length} comments have been posted`;
        }

        // Clear and render reviews
        reviewList.innerHTML = '';
        reviews.forEach(review => {
            const reviewHTML = `
                <div class="review">
                    <div class="review review-box position-relative border p-3 mb-3 rounded">
                    <div class="review-user"><strong>${review.userId?.username || 'Unknown User'}</strong></div>
                    <div class="review-rating">
                        ${'<span class="gold-star">★</span>'.repeat(review.rating)}
                        ${'<span class="empty-star">☆</span>'.repeat(10 - review.rating)}
                    </div>
                    <div class="review-text">${review.text}</div>
                    <div class="review-date text-muted">${new Date(review.date).toLocaleString()}</div>
                </div>
            `;
            reviewList.innerHTML += reviewHTML;
        });

    } catch (err) {
        console.error('Error loading reviews:', err);
        commentCount.textContent = 'Failed to load reviews.';
    }
}

// Setup main bookmark button
async function setupBookmarkButton() {
    const bookmarkBtn = document.getElementById('bookmarkBtn');
    if (!bookmarkBtn) return;
    
    const movieId = bookmarkBtn.getAttribute('data-movie-id');
    
    // Update button state based on watchlist
    if (await isInWatchlist(movieId)) {
        bookmarkBtn.classList.add('active');
        bookmarkBtn.innerHTML = '<i class="fas fa-bookmark me-2"></i> Added';
    }

    bookmarkBtn.addEventListener('click', async () => {
        const movieData = {
            id: String(movieId),
            title: window.movieData.title,
            year: window.movieData.release_date ? window.movieData.release_date.split('-')[0] : 'N/A',
            description: window.movieData.overview || 'No description available',
            img: window.movieData.poster_path ? IMAGE_URL + window.movieData.poster_path : '/images/default-poster.jpg',
            rating: window.movieData.vote_average ? window.movieData.vote_average.toFixed(1) : 'N/A',
            watched: false
        };

        await toggleWatchlistForDetailPage(bookmarkBtn, movieId, movieData);
    });
}

// Setup similar movies buttons
async function setupSimilarMoviesButtons() {
    for (const btn of document.querySelectorAll('.similar-movie-card .btn')) {
        const similarId = btn.getAttribute('data-id');
        const similarMovie = window.similarMovies.find(m => String(m.id) === similarId);
        
        if (!similarMovie) return;

        const movieEntry = {
            id: String(similarMovie.id),
            title: similarMovie.title,
            img: similarMovie.poster_path ? IMAGE_URL + similarMovie.poster_path : '/images/default-poster.jpg',
            rating: similarMovie.vote_average ? similarMovie.vote_average.toFixed(1) : 'N/A',
            description: similarMovie.overview || 'No description available',
            year: similarMovie.release_date ? similarMovie.release_date.split('-')[0] : 'N/A',
            watched: false
        };

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleWatchlistForDetailPage(btn, similarId, movieEntry);
        });

        if (await isInWatchlist(similarId)) {
            btn.classList.add('active');
            btn.innerHTML = '<i class="fas fa-bookmark me-2"></i>Added';
        }
    }
}

// Update all watchlist button states
async function updateWatchlistButtons() {
    // Update main bookmark button
    const bookmarkBtn = document.getElementById('bookmarkBtn');
    if (bookmarkBtn) {
        const movieId = bookmarkBtn.getAttribute('data-movie-id');
        const inWatchlist = await isInWatchlist(movieId);
        if (inWatchlist) {
            bookmarkBtn.classList.add('active');
            bookmarkBtn.innerHTML = '<i class="fas fa-bookmark me-2"></i> Added';
        }
    }

    // Update similar movies buttons
    for (const btn of document.querySelectorAll('.similar-movie-card .btn')) {
        const movieId = btn.getAttribute('data-id');
        const inWatchlist = await isInWatchlist(movieId);
        if (inWatchlist) {
            btn.classList.add('active');
            btn.innerHTML = '<i class="fas fa-bookmark me-2"></i>Added';
        }
    }
}

// Check if movie is in watchlist (MongoDB)
async function isInWatchlist(movieId) {
    try {
        const response = await fetch(`/watchlist/check/${movieId}`, {
            headers: { 'Accept': 'application/json' }, 
            credentials: 'include',
            redirect: 'manual'                         
        });

        if (response.status === 200) {
            const data = await response.json();
            return data.inWatchlist;
        } 

        return false;
        
    } catch (error) {
        console.error('Error checking watchlist:', error);
        return false;
    }
}

// Toggle watchlist for detail page (MongoDB)
async function toggleWatchlistForDetailPage(buttonElement, movieId, movieData) {
    try {
        // First check if movie is in watchlist
        const inWatchlist = await isInWatchlist(movieId);
        
        if (!inWatchlist) {
            // Add to watchlist
            const response = await fetch('/watchlist/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                redirect: 'manual',
                body: JSON.stringify(movieData)
            });

            if (response.ok) {
                buttonElement.classList.add('active');
                buttonElement.innerHTML = '<i class="fas fa-bookmark me-2"></i> Added';
                buttonElement.setAttribute('data-watchlisted', 'true');
                showToast('Added to Watchlist');
            } else if (response.status === 401) {
                promptLogin('Please log in to add movies to your watchlist.');
                return;
            } else {
                const data = await response.json();
                showToast(data.message || 'Error adding to watchlist');
            }
        } else {
            const response = await fetch('/watchlist/remove', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                redirect: 'manual',
                body: JSON.stringify({ movieId })
            });

            if (response.ok) {
                buttonElement.classList.remove('active');
                buttonElement.innerHTML = '<i class="far fa-bookmark me-2"></i> Watchlist';
                buttonElement.setAttribute('data-watchlisted', 'false');
                showToast('Removed from Watchlist');
            } else if (response.status === 401) {
                promptLogin('Please log in to add movies to your watchlist.');
            } else {
                const data = await response.json();
                showToast(data.message || 'Error removing from watchlist');
            }
        }
    } catch (error) {
        console.error('Error toggling watchlist:', error);
        showToast('Network error. Please try again.');
    }
}

// Toast notification
let toastTimeout;
function showToast(message) {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// Load reviews for current movie on page load
// Add to history when movie detail page is loaded
if (window.movieData && window.movieData.id) {
    loadReviews(window.movieData.id);
}

async function addToHistory(movieId, title) {
    try {
        const response = await fetch('/history/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                movieId: String(movieId),
                title: title,
                timestamp: new Date().toISOString()
            })
        });

        const data = await response.json();
        if (data.message !== 'Movie added to watch history' && data.message !== 'Movie already in history') {
            console.warn('Unexpected response:', data);
        }
    } catch (error) {
        console.error('Error adding movie to history:', error);
    }
}

function promptLogin(message = 'Please log in to view your watchlist.') {
  if (typeof showAuthModal === 'function') {
    showAuthModal(message);
  } else {
    // fallback (should never fire once modal assets load)
    window.location.href = '/login';
  }
}