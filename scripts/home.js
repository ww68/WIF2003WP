const arrows = document.querySelectorAll(".arrow");
const movieLists = document.querySelectorAll(".movie-list");

arrows.forEach((arrow, i) => {
const itemNumber = movieLists[i].querySelectorAll("img").length;
let clickCounter = 0;
arrow.addEventListener("click", () => {
    const ratio = Math.floor(window.innerWidth / 270);
    clickCounter++;
    if (itemNumber - (4 + clickCounter) + (4 - ratio) >= 0) {
    movieLists[i].style.transform = `translateX(${
        movieLists[i].computedStyleMap().get("transform")[0].x.value - 300
    }px)`;
    } else {
    movieLists[i].style.transform = "translateX(0)";
    clickCounter = 0;
    }
});

console.log(Math.floor(window.innerWidth / 270));
});

// // //TOGGLE THEME

// // const ball = document.querySelector(".toggle-ball");
// // const items = document.querySelectorAll(
// // ".container,.movie-list-title,.navbar-container,.sidebar,.left-menu-icon,.toggle"
// // );

// // ball.addEventListener("click", () => {
// // items.forEach((item) => {
// //     item.classList.toggle("active");
// // });
// // ball.classList.toggle("active");
// // });

// Toggle movie in/out of watchlist
function toggleWatchlist(iconElement, movieId) {

    let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];

    const movieItem = iconElement.closest('.movie-list-item');

    if (!movieItem) {
        console.error("Could not find parent .movie-list-item");
        return; // Stop execution if parent not found
    }

    // Extract movie data from the closest movie item
    const movieData = {
        id: movieId,
        title: movieItem.querySelector('.movie-list-item-title')?.textContent || 'Unknown Title', 
        year: 2025, // hardcoded
        description: movieItem.querySelector('.movie-list-item-desc')?.textContent || 'No description available.', 
        img: movieItem.querySelector('.movie-list-item-img')?.getAttribute('src') || 'placeholder.jpg', 
        rating: "7.0", // hardcoded
        watched: false 
    };

    const movieIndex = watchlist.findIndex(movie => movie.id === movieId);

    if (movieIndex === -1) {
        // Movie is not in watchlist, add it
        watchlist.push(movieData);
        iconElement.classList.add('active'); 
        showToast('Added to Watchlist');
    } else {
        // Movie is in watchlist, remove it
        watchlist.splice(movieIndex, 1);
        iconElement.classList.remove('active'); 
        showToast('Removed from Watchlist');
    }

    localStorage.setItem('watchlist', JSON.stringify(watchlist));
}

// Check if movie is already in watchlist
function isInWatchlist(movieId) {
    const watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
    return watchlist.some(movie => movie.id === movieId);
}

// Show notification
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000); 
}

// Initialize icons and attach event listeners on load
document.addEventListener('DOMContentLoaded', function () {
    const movieItems = document.querySelectorAll('.movie-list-item');

    movieItems.forEach(item => {
        const movieId = item.getAttribute('movie-id');
        const bookmarkIcon = item.querySelector('.bookmark-icon');

        console.log("movie-id:", movieId);
        console.log("bookmark-icon:", bookmarkIcon);

        if (movieId && bookmarkIcon) {
            // Set icon state
            const watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
            if (watchlist.find(movie => movie.id === movieId)) {
                bookmarkIcon.classList.add('active');
            }

            // Add click handler
            bookmarkIcon.addEventListener('click', function () {
                console.log("Clicked", movieId);
                toggleWatchlist(this, movieId);
            });
        }
    });
});  