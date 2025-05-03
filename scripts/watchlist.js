function renderWatchlist() {
    const container = document.getElementById("watchlistContainer");
    const watchlist = JSON.parse(localStorage.getItem("watchlist")) || [
    {
        id: "john-wick",
        title: "John Wick",
        year: 2014,
        description: "Ex-hitman John Wick comes out of retirement to track down the gangsters that took everything from him.",
        img: "images/watchlist/watchlist-john-wick.avif",
        imdb: "7.5",
        watched: true
    },
    {
        id: "avengers-endgame",
        title: "Avengers: Endgame",
        year: 2019,
        description: "After the devastating events of Infinity War, the universe is in ruins due to the efforts of the Mad Titan, Thanos.",
        img: "images/watchlist/watchlist-avengers-endgame.avif",
        imdb: "8.4",
        watched: true
    },
    {
        id: "electric-state",
        title: "The Electric State",
        year: 2025,
        description: "An orphaned teen hits the road with a mysterious robot to find her long-lost brother, teaming up with a smuggler and his wisecracking sidekick.",
        img: "images/watchlist/watchlist-the-electric-state.avif",
        imdb: "6.9",
        watched: true
    },
    {
        id: "black-mirror",
        title: "Black Mirror",
        year: 2011,
        description: "Featuring stand-alone dramas -- sharp, suspenseful, satirical tales that explore techno-paranoia -- \"Black Mirror\" is a contemporary reworking of \"The Twilight Zone\" with stories that tap into the collective unease about the modern world.",
        img: "images/watchlist/watchlist-black-mirror.avif",
        imdb: "8.7",
        watched: false
    },
    {
        id: "conclave",
        title: "Conclave",
        year: 2025,
        description: "When Cardinal Lawrence is tasked with leading one of the world's most secretive and ancient events, selecting a new Pope, he finds himself at the center of a web of conspiracies and intrigue that could shake the very foundation of the Catholic Church.",
        img: "images/watchlist/watchlist-conclave.avif",
        imdb: "7.4",
        watched: false
    }];

    container.innerHTML = "";

    if (watchlist.length === 0) {
    container.innerHTML = `
        <div class="d-flex justify-content-center align-items-center vh-100">
        <div class="text-center px-3">
        <h4 class="fw-bold mb-2">Your Watchlist</h4>
        <p class="text-muted mb-4">You haven’t added any movies yet. Start exploring and save your favorites to watch later — all in one place.</p>
        <a href="index.html" class="btn btn-primary fw-semibold px-4 py-2">
            Discover something new to watch
        </a>
        </div>
        </div>`;
    return;
    }

    watchlist.forEach(movie => {
    const card = document.createElement("div");
    card.className = "col-sm-12 col-md-6 col-lg-4 movie-card";
    card.innerHTML = `
        <div class="card h-100 text-white">
        <div class="row g-0 h-100 d-flex align-items-stretch">
            <div class="position-absolute top-0 start-0 ms-2 mt-2">
            <div class="bookmark-circle d-flex align-items-center justify-content-center">
                <i class="fa-solid fa-bookmark text-warning fs-6 bookmark-icon" onclick="removeFromWatchlist('${movie.id}', this)"></i>
            </div>
            </div>
            <div class="col-5">
            <div class="img-wrapper h-100">
                <img src="${movie.img}" class="img-fluid rounded-start" alt="${movie.title}">
            </div>
            </div>
            <div class="col-7 card-body-side">
            <h5 class="card-title">${movie.title} <span class="text-muted fs-6">(${movie.year})</span></h5>
            <p class="card-text small text-muted mt-2 truncate-description">${movie.description}</p>
            <div class="mt-auto">
                <span class="imdb-badge">${movie.imdb}</span>
                <a href="#" class="btn btn-primary mt-3 w-100"><i class="fab fa-netflix me-2"></i>Watch now</a>
            </div>    
            </div>
        </div>
        </div>`;
    container.appendChild(card);
    });
}

function removeFromWatchlist(id, icon) {
    let watchlist = JSON.parse(localStorage.getItem("watchlist")) || [];
    watchlist = watchlist.filter(movie => movie.id !== id);
    localStorage.setItem("watchlist", JSON.stringify(watchlist));

    const card = icon.closest(".movie-card");
    if (card) card.remove();

    if (watchlist.length === 0) {
    document.getElementById("watchlistContainer").innerHTML = `
        <div class="d-flex justify-content-center align-items-center vh-100">
        <div class="text-center px-3">
        <h4 class="fw-bold mb-2">Your Watchlist</h4>
        <p class="text-muted mb-4">You haven’t added any movies yet. Start exploring and save your favorites to watch later — all in one place.</p>
        <a href="index.html" class="btn btn-primary fw-semibold px-4 py-2">
            Discover something new to watch
        </a>
        </div>
    </div>`;
    }
}
document.addEventListener("DOMContentLoaded", renderWatchlist);