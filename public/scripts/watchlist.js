document.addEventListener("DOMContentLoaded", function() {
    
    // Add event listeners to filter buttons
    const filterButtons = document.querySelectorAll("#watchlistFilter .nav-link");
    filterButtons.forEach(button => {
        button.addEventListener("click", function() {

            // Get the filter value
            const filterValue = this.getAttribute("data-filter");
            
            // Redirect to watchlist with filter parameter
            window.location.href = `/watchlist?filter=${filterValue}`;
        });
    });
});

async function removeFromWatchlist(movieId) {
    console.log('removeFromWatchlist called for', movieId);  
    showConfirmModal('Remove this movie from your watchlist?', async () => {
        try {
            const response = await fetch('/watchlist/remove', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ movieId: movieId })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Remove the card from DOM
                document.querySelector(`.movie-card[data-id="${movieId}"]`)?.remove();
                if (!document.querySelector('.movie-card')) {
                    location.reload();
                } else {
                    console.error('Failed to remove movie from watchlist');
                }
            }
        } catch (error) {
            console.error('Error removing movie from watchlist:', error);
        }
    });
}

async function toggleWatchedStatus(movieId) {
    try {
        const response = await fetch('/watchlist/toggle', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ movieId: movieId })
        });
        
        const result = await response.json();
        
        if (result.success) {
            const currentFilter = window.currentFilter;
            
            // If we're in a filtered view and the movie no longer matches the filter,
            // remove it from the current view
            if ((currentFilter === 'watched' && !result.watched) || 
                (currentFilter === 'unwatched' && result.watched)) {
                
                const card = document.querySelector(`.movie-card[data-id="${movieId}"]`);
                if (card) {
                    card.remove();
                }
                
                // Check if we need to show empty state
                const remainingCards = document.querySelectorAll('.movie-card');
                if (remainingCards.length === 0) {
                    window.location.reload();
                }
            } else {
                // Update the UI to reflect the new status
                updateMovieCard(movieId, result.watched);
            }
        } else {
            console.error('Failed to toggle watched status');
        }
    } catch (error) {
        console.error('Error toggling watched status:', error);
    }
}

function updateMovieCard(movieId, watched) {
    const card = document.querySelector(`.movie-card[data-id="${movieId}"]`);
    if (!card) return;
    
    // Update watched status classes
    card.className = card.className.replace(/watched|unwatched/, watched ? 'watched' : 'unwatched');
    
    // Update badge
    const badgeEl = card.querySelector('.badge');
    if (badgeEl) {
        if (watched) {
            badgeEl.className = 'badge bg-success me-2';
            badgeEl.innerHTML = '<i class="fas fa-check me-1"></i>Watched';
        } else {
            badgeEl.className = 'badge bg-secondary me-2';
            badgeEl.innerHTML = '<i class="fas fa-clock me-1"></i>Unwatched';
        }
    }

    // Update toggle button icon
    const toggleIcon = card.querySelector('.watch-toggle-circle .fas');
    if (toggleIcon) {
        if (watched) {
            toggleIcon.className = 'fas fa-times text-white fs-6';
            toggleIcon.title = 'Mark as unwatched';
        } else {
            toggleIcon.className = 'fas fa-check text-white fs-6';
            toggleIcon.title = 'Mark as watched';
        }
    }
}

async function addToWatchlist(movieData) {
    try {
        const response = await fetch('/watchlist/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(movieData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Show success message or update UI
            console.log('Movie added to watchlist');
            return true;
        } else {
            console.log(result.message);
            return false;
        }
    } catch (error) {
        console.error('Error adding movie to watchlist:', error);
        return false;
    }
}