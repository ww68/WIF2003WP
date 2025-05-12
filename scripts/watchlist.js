document.addEventListener("DOMContentLoaded", function() {
    // Initialize the watchlist
    renderWatchlist("all");
    
    // Add event listeners to filter buttons
    const filterButtons = document.querySelectorAll("#watchlistFilter .nav-link");
    filterButtons.forEach(button => {
        button.addEventListener("click", function() {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove("active"));
            
            // Add active class to clicked button
            this.classList.add("active");
            
            // Get the filter value
            const filterValue = this.getAttribute("data-filter");
            
            // Apply the filter
            renderWatchlist(filterValue);
        });
    });
});

function renderWatchlist(filter = "all") {
    const container = document.getElementById("watchlistContainer");
    let watchlist = JSON.parse(localStorage.getItem("watchlist")) || [];

    container.innerHTML = "";

    // Filter the watchlist based on the selected filter
    let filteredWatchlist = watchlist;
    if (filter === "watched") {
        filteredWatchlist = watchlist.filter(movie => movie.watched === true);
    } else if (filter === "unwatched") {
        filteredWatchlist = watchlist.filter(movie => movie.watched === false);
    }

    console.log("Filter:", filter);
    console.log("Filtered watchlist:", filteredWatchlist);

    if (filteredWatchlist.length === 0) {
        renderEmptyState(filter, watchlist.length === 0);
        return;
    }    
    

    filteredWatchlist.forEach(movie => {
    const watchStatus = movie.watched ? 
        '<span class="badge bg-success me-2"><i class="fas fa-check me-1"></i>Watched</span>' : 
        '<span class="badge bg-secondary me-2"><i class="fas fa-clock me-1"></i>Unwatched</span>';

    const card = document.createElement("div");
    card.className = `col-sm-12 col-md-6 col-lg-4 movie-card ${movie.watched ? 'watched' : 'unwatched'}`;
    card.innerHTML = `
    <div class="card h-100 text-white position-relative">
        <div class="position-absolute top-0 start-0 ms-2 mt-2">
        <div class="bookmark-circle d-flex align-items-center justify-content-center">
            <i class="fa-solid fa-bookmark text-warning fs-6 bookmark-icon"
            onclick="removeFromWatchlist('${movie.id}', this)"></i>
        </div>
        </div>
        <div class="row g-0 h-100 d-flex align-items-stretch">
        <div class="col-5">
            <div class="img-wrapper h-100">
            <img src="${movie.img}" onerror="this.onerror=null; this.src='images/default-poster.jpg'" class="img-fluid rounded-start" alt="${movie.title}">
            </div>
        </div>
        <div class="col-7 card-body-side">
            <div class="d-flex justify-content-between align-items-start">
                <h5 class="card-title mb-2">${movie.title}</h5>
                <div class="watch-toggle-container position-absolute top-0 end-0 me-2 mt-2">
                    <div class="watch-toggle-circle d-flex align-items-center justify-content-center">
                    <button class="btn p-0 border-0 bg-transparent" onclick="toggleWatchedStatus('${movie.id}')">
                        <i class="fas ${movie.watched ? 'fa-times' : 'fa-check'} text-white fs-6" 
                        title="${movie.watched ? 'Mark as unwatched' : 'Mark as watched'}"></i>
                    </button>
                    </div>
                </div>
            </div>
            <div class="">
                <div class="d-flex align-items-center gap-2 mb-2 text-muted small">
                    <span>${movie.year} | </span>
                    <span class="rating-star d-flex align-items-center">
                        <i class="fas fa-star text-warning me-1"></i>
                        ${movie.rating} | 
                    </span>
                    ${watchStatus}
                </div>
            </div>
            <p class="card-text small text-muted mb-5 truncate-description">${movie.description}</p>
            <div class="d-flex">
                <a href="movie.html?id=${movie.id}" class="btn btn-primary flex-grow-1">
                <i class="fab fa-netflix me-2"></i>Watch now
                </a>
            </div>
        </div>
        </div>
    </div>
`;

    container.appendChild(card);
    });
}

function removeFromWatchlist(id, icon) {
    let watchlist = JSON.parse(localStorage.getItem("watchlist")) || [];
    watchlist = watchlist.filter(movie => movie.id !== String(id));
    localStorage.setItem("watchlist", JSON.stringify(watchlist));

    const card = icon.closest(".movie-card");
    if (card) card.remove();

    // Get current active filter
    const activeFilter = document.querySelector("#watchlistFilter .nav-link.active").getAttribute("data-filter");

    // Check if we need to show the empty state
    const filteredWatchlist = activeFilter === "all" ? 
        watchlist : 
        activeFilter === "watched" ? 
            watchlist.filter(movie => movie.watched) : 
            watchlist.filter(movie => !movie.watched);

    if (filteredWatchlist.length === 0) {
        renderEmptyState(activeFilter, watchlist.length === 0);
    }
}
function toggleWatchedStatus(id) {
    let watchlist = JSON.parse(localStorage.getItem("watchlist") || "[]");
    const index = watchlist.findIndex(movie => movie.id === String(id));
    
    if (index !== -1) {
        // Toggle the watched status
        watchlist[index].watched = !watchlist[index].watched;
        localStorage.setItem("watchlist", JSON.stringify(watchlist));
        
        // Get current active filter
        const activeFilter = document.querySelector("#watchlistFilter .nav-link.active").getAttribute("data-filter");
        
        // Re-render the watchlist with the current filter
        renderWatchlist(activeFilter);
    }
}

function renderEmptyState(filter, isCompletelyEmpty) {
    const container = document.getElementById("watchlistContainer");

    if (isCompletelyEmpty) {
        container.innerHTML = `
            <div class="text-center mt-5 p-3">
                <img src="https://cdn-icons-png.flaticon.com/512/4076/4076549.png" alt="Empty Watchlist" width="120" class="mb-3">
                <p class="text-muted mb-4">You haven’t added any movies yet. Start exploring and save your favorites to watch later — all in one place.</p>
                <a href="index.html" class="btn btn-primary fw-semibold px-4 py-2">
                    Discover something new to watch
                </a>
            </div>`;
    } else {
        container.innerHTML = `
            <div class="text-center p-3 empty-movie-notification">
                <h4 class="fw-bold mb-2">No ${filter} movies</h4>
                <p class="text-muted mb-4">You don't have any ${filter} movies in your watchlist.</p>
            </div>`;
    }
}