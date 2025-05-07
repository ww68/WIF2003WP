// hardcode now, will be replaced with API calls later
const movieData = {
    'her': {
        title: 'Her',
        year: '2013',
        duration: '126 min',
        rating: '8.0',
        image: 'movie-website-master/img/1.jpeg',
        banner: 'movie-website-master/img/1.jpeg',
        director: 'Spike Jonze',
        description: 'In a near future, a lonely writer develops an unlikely relationship with an operating system designed to meet his every need.',
        genres: ['Romance', 'Sci-Fi', 'Drama'],
        cast: [
            { name: 'Joaquin Phoenix', role: 'Theodore', image: 'https://via.placeholder.com/150' },
            { name: 'Scarlett Johansson', role: 'Samantha (voice)', image: 'https://via.placeholder.com/150' },
            { name: 'Amy Adams', role: 'Amy', image: 'https://via.placeholder.com/150' }
        ],
        similar: [
            { id: 'star-wars', title: 'Star Wars', image: 'movie-website-master/img/2.jpeg' },
            { id: 'storm', title: 'Storm', image: 'movie-website-master/img/3.jpg' },
            { id: '1917', title: '1917', image: 'movie-website-master/img/4.jpg' }
        ]
    },
    'star-wars': {
        title: 'Star Wars',
        year: '1977',
        duration: '121 min',
        rating: '8.6',
        image: 'movie-website-master/img/2.jpeg',
        banner: 'movie-website-master/img/2.jpeg',
        director: 'George Lucas',
        description: 'Luke Skywalker joins forces with a Jedi Knight, a cocky pilot, a Wookiee and two droids to save the galaxy from the Empire\'s world-destroying battle station, while also attempting to rescue Princess Leia from the mysterious Darth Vader.',
        genres: ['Action', 'Adventure', 'Fantasy'],
        cast: [
            { name: 'Mark Hamill', role: 'Luke Skywalker', image: 'https://via.placeholder.com/150' },
            { name: 'Harrison Ford', role: 'Han Solo', image: 'https://via.placeholder.com/150' },
            { name: 'Carrie Fisher', role: 'Princess Leia', image: 'https://via.placeholder.com/150' }
        ],
        similar: [
            { id: 'her', title: 'Her', image: 'movie-website-master/img/1.jpeg' },
            { id: 'storm', title: 'Storm', image: 'movie-website-master/img/3.jpg' },
            { id: 'avengers', title: 'Avengers', image: 'movie-website-master/img/5.jpg' }
        ]
    },
    'storm': {
        title: 'Storm',
        year: '2020',
        duration: '118 min',
        rating: '7.4',
        image: 'movie-website-master/img/3.jpg',
        banner: 'movie-website-master/img/3.jpg',
        director: 'Example Director',
        description: 'A thrilling tale of survival against the elements as a massive storm system threatens to destroy everything in its path.',
        genres: ['Action', 'Thriller', 'Disaster'],
        cast: [
            { name: 'Actor One', role: 'Character One', image: 'https://via.placeholder.com/150' },
            { name: 'Actor Two', role: 'Character Two', image: 'https://via.placeholder.com/150' },
            { name: 'Actor Three', role: 'Character Three', image: 'https://via.placeholder.com/150' }
        ],
        similar: [
            { id: '1917', title: '1917', image: 'movie-website-master/img/4.jpg' },
            { id: 'avengers', title: 'Avengers', image: 'movie-website-master/img/5.jpg' },
            { id: 'rampage', title: 'Rampage', image: 'movie-website-master/img/6.jpg' }
        ]
    },
    '1917': {
        title: '1917',
        year: '2019',
        duration: '119 min',
        rating: '8.3',
        image: 'movie-website-master/img/4.jpg',
        banner: 'movie-website-master/img/4.jpg',
        director: 'Sam Mendes',
        description: 'During World War I, two British soldiers receive seemingly impossible orders. In a race against time, they must cross enemy territory to deliver a message that could potentially save 1,600 of their fellow comrades.',
        genres: ['Drama', 'War', 'Action'],
        cast: [
            { name: 'George MacKay', role: 'Lance Corporal Schofield', image: 'https://via.placeholder.com/150' },
            { name: 'Dean-Charles Chapman', role: 'Lance Corporal Blake', image: 'https://via.placeholder.com/150' },
            { name: 'Mark Strong', role: 'Captain Smith', image: 'https://via.placeholder.com/150' }
        ],
        similar: [
            { id: 'storm', title: 'Storm', image: 'movie-website-master/img/3.jpg' },
            { id: 'avengers', title: 'Avengers', image: 'movie-website-master/img/5.jpg' },
            { id: 'ender-game', title: 'Ender\'s Game', image: 'movie-website-master/img/7.jpg' }
        ]
    },
    'avengers': {
        title: 'Avengers',
        year: '2012',
        duration: '143 min',
        rating: '8.0',
        image: 'movie-website-master/img/5.jpg',
        banner: 'movie-website-master/img/5.jpg',
        director: 'Joss Whedon',
        description: 'Earth\'s mightiest heroes must come together and learn to fight as a team if they are going to stop the mischievous Loki and his alien army from enslaving humanity.',
        genres: ['Action', 'Adventure', 'Sci-Fi'],
        cast: [
            { name: 'Robert Downey Jr.', role: 'Tony Stark / Iron Man', image: 'https://via.placeholder.com/150' },
            { name: 'Chris Evans', role: 'Steve Rogers / Captain America', image: 'https://via.placeholder.com/150' },
            { name: 'Scarlett Johansson', role: 'Natasha Romanoff / Black Widow', image: 'https://via.placeholder.com/150' }
        ],
        similar: [
            { id: 'star-wars', title: 'Star Wars', image: 'movie-website-master/img/2.jpeg' },
            { id: 'rampage', title: 'Rampage', image: 'movie-website-master/img/6.jpg' },
            { id: 'ender-game', title: 'Ender\'s Game', image: 'movie-website-master/img/7.jpg' }
        ]
    },
    'rampage': {
        title: 'Rampage',
        year: '2018',
        duration: '107 min',
        rating: '6.1',
        image: 'movie-website-master/img/6.jpg',
        banner: 'movie-website-master/img/6.jpg',
        director: 'Brad Peyton',
        description: 'When three different animals become infected with a dangerous pathogen, a primatologist and a geneticist team up to stop them from destroying Chicago.',
        genres: ['Action', 'Adventure', 'Sci-Fi'],
        cast: [
            { name: 'Dwayne Johnson', role: 'Davis Okoye', image: 'https://via.placeholder.com/150' },
            { name: 'Naomie Harris', role: 'Dr. Kate Caldwell', image: 'https://via.placeholder.com/150' },
            { name: 'Jeffrey Dean Morgan', role: 'Agent Russell', image: 'https://via.placeholder.com/150' }
        ],
        similar: [
            { id: 'avengers', title: 'Avengers', image: 'movie-website-master/img/5.jpg' },
            { id: 'ender-game', title: 'Ender\'s Game', image: 'movie-website-master/img/7.jpg' },
            { id: 'storm', title: 'Storm', image: 'movie-website-master/img/3.jpg' }
        ]
    },
    'ender-game': {
        title: 'Ender\'s Game',
        year: '2013',
        duration: '114 min',
        rating: '6.6',
        image: 'movie-website-master/img/7.jpg',
        banner: 'movie-website-master/img/7.jpg',
        director: 'Gavin Hood',
        description: 'Young Ender Wiggin is recruited by the International Military to lead the fight against the Formics, an insectoid alien race who had previously tried to invade Earth and had inflicted heavy losses on humankind.',
        genres: ['Action', 'Adventure', 'Sci-Fi'],
        cast: [
            { name: 'Asa Butterfield', role: 'Ender Wiggin', image: 'https://via.placeholder.com/150' },
            { name: 'Harrison Ford', role: 'Colonel Graff', image: 'https://via.placeholder.com/150' },
            { name: 'Hailee Steinfeld', role: 'Petra Arkanian', image: 'https://via.placeholder.com/150' }
        ],
        similar: [
            { id: 'star-wars', title: 'Star Wars', image: 'movie-website-master/img/2.jpeg' },
            { id: 'avengers', title: 'Avengers', image: 'movie-website-master/img/5.jpg' },
            { id: 'her', title: 'Her', image: 'movie-website-master/img/1.jpeg' }
        ]
    }
};

// Function to get URL parameters
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

function loadMovieData() {
    const movieId = getUrlParameter('id');

    if (!movieId || !movieData[movieId]) {
        document.getElementById('movie-content').innerHTML = `
            <div class="container mt-5 text-center">
                <h2>Movie not found</h2>
                <p>The movie you're looking for doesn't exist or has been removed.</p>
                <a href="index.html" class="btn btn-primary">Return to Homepage</a>
            </div>`;
        return;
    }

    const movie = movieData[movieId];

    const movieHTML = `
    <div class="movie-banner" style="background-image: url('${movie.banner}');">
        <div class="container movie-info">
            <h1 class="display-4 fw-bold">${movie.title}</h1>
            <div class="movie-meta">
                <span><i class="far fa-calendar-alt me-2"></i> ${movie.year}</span>
                <span><i class="far fa-clock me-2"></i> ${movie.duration}</span>
                <span><i class="fas fa-star text-warning me-2"></i> ${movie.rating}/10</span>
                <span><i class="fas fa-user me-2"></i> Director: ${movie.director}</span>
            </div>
            <div class="mb-3">
                ${movie.genres.map(genre => `<span class="genre-badge">${genre}</span>`).join('')}
            </div>
            <div class="action-buttons mt-4">
                <button class="btn btn-primary"><i class="fas fa-play me-2"></i>Watch Now</button>
                <button class="btn btn-outline-light add-bookmark-btn" id="bookmarkBtn">
                    <i class="far fa-bookmark me-2"></i> Add to Watchlist
                </button>
                <button class="btn btn-outline-light"><i class="fas fa-share-alt me-2"></i>Share</button>
            </div>
        </div>
    </div>

    <div class="container mt-5">
        <div class="mb-5">
            <h3 class="section-header text-uppercase">Synopsis</h3>
            <p class="lead">${movie.description}</p>
        </div>

        <div class="mb-5">
            <h3 class="section-header text-uppercase">Trailer</h3>
            <div class="trailer-container">
                ${movie.trailerEmbed ? movie.trailerEmbed : 
                `<img src="${movie.trailerThumbnail || movie.banner}" alt="Movie Trailer Thumbnail" style="width: 100%; height: 100%; position: absolute;">
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
                    <button class="btn btn-primary btn-lg rounded-circle" style="width: 80px; height: 80px;">
                        <i class="fas fa-play fa-2x"></i>
                    </button>
                </div>`}
            </div>
        </div>

        <ul class="nav nav-tabs mb-4" id="movieContentTabs" role="tablist">
            <li class="nav-item" role="presentation">
                <button class="nav-link active" id="cast-tab" data-bs-toggle="tab" data-bs-target="#cast" type="button" role="tab" aria-controls="cast" aria-selected="true">
                    <i class="fas fa-users me-2"></i>Cast & Crew
                </button>
            </li>
            <li class="nav-item" role="presentation">
                <button class="nav-link" id="reviews-tab" data-bs-toggle="tab" data-bs-target="#reviews" type="button" role="tab">
                    <i class="fas fa-star me-2"></i>Reviews
                </button>
            </li>
            <li class="nav-item" role="presentation">
                <button class="nav-link" id="similar-tab" data-bs-toggle="tab" data-bs-target="#similar" type="button" role="tab">
                    <i class="fas fa-film me-2"></i>Similar Movies
                </button>
            </li>
        </ul>

        <div class="tab-content" id="movieContentTabsContent">
            <div class="tab-pane fade show active" id="cast" role="tabpanel">
                <div class="row row-cols-2 row-cols-md-3 row-cols-lg-5 g-4">
                    ${movie.cast.map(person => `
                        <div class="col">
                            <div class="card bg-dark text-light h-100 border-secondary shadow-sm cast-card">
                                <img src="${person.image}" class="card-img-top" alt="${person.name}">
                                <div class="card-body text-center">
                                    <h5 class="card-title">${person.name}</h5>
                                    <p class="card-text text-muted">${person.role}</p>
                                </div>
                            </div>
                        </div>`).join('')}
                </div>
            </div>

            <div class="tab-pane fade" id="similar" role="tabpanel">
                <div class="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-4">
                    ${movie.similar.map(similarMovie => `
                        <div class="col">
                            <div class="card bg-dark text-light h-100 shadow-sm border-secondary similar-movie-card" onclick="window.location.href='movie-description.html?id=${similarMovie.id}'">
                                <img src="${similarMovie.image}" class="card-img-top" alt="${similarMovie.title}">
                                <div class="card-body text-center">
                                    <h5 class="card-title">${similarMovie.title}</h5>
                                </div>
                                <div class="card-footer bg-transparent border-0 text-center">
                                    <button class="btn btn-sm btn-outline-light w-100" data-id="${similarMovie.id}">
                                        <i class="fas fa-plus me-2"></i>Watchlist
                                    </button>
                                </div>
                            </div>
                        </div>`).join('')}
                </div>
            </div>
        </div>
    </div>`;

    document.getElementById('movie-content').innerHTML = movieHTML;

    const bookmarkBtn = document.getElementById('bookmarkBtn');

    if (isInWatchlist(movieId)) {
        bookmarkBtn.classList.add('active');
        bookmarkBtn.innerHTML = '<i class="fas fa-bookmark"></i> Added';
    }

    bookmarkBtn.addEventListener('click', function () {
        toggleWatchlistForDetailPage(this, movieId, movie);
    });

    document.querySelectorAll('.similar-movie-card .btn').forEach(btn => {
        const similarId = btn.getAttribute('data-id');
        const similarMovie = movieData[similarId];

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleWatchlistForDetailPage(btn, similarId, similarMovie);
        });

        if (isInWatchlist(similarId)) {
            btn.classList.add('active');
            btn.innerHTML = '<i class="fas fa-bookmark me-2"></i>Added';
        }
    });
}

function isInWatchlist(movieId) {
    const watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
    return watchlist.some(movie => movie.id === movieId);
}

function toggleWatchlistForDetailPage(buttonElement, movieId, movie) {
    let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];

    const movieEntry = {
        id: movieId,
        title: movie.title,
        year: movie.year || "Unknown",
        description: movie.description || "No description available.",
        img: movie.image,
        rating: movie.rating || "N/A",
        watched: false
    };

    const movieIndex = watchlist.findIndex(m => m.id === movieId);

    if (movieIndex === -1) {
        watchlist.push(movieEntry);
        buttonElement.classList.add('active');
        buttonElement.innerHTML = '<i class="fas fa-bookmark"></i> Added';
        showToast('Added to Watchlist');
    } else {
        watchlist.splice(movieIndex, 1);
        buttonElement.classList.remove('active');
        buttonElement.innerHTML = '<i class="far fa-bookmark"></i> Add to Watchlist';
        showToast('Removed from Watchlist');
    }

    localStorage.setItem('watchlist', JSON.stringify(watchlist));
}

let toastTimeout;
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

document.addEventListener('DOMContentLoaded', loadMovieData);