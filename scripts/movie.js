const API_KEY = '9a56291f8d522c5f874ed7812f062758';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/w500';

const urlParams = new URLSearchParams(window.location.search);
const movieId = urlParams.get("id");
const avgRating = getAverageRating(movieId);

async function fetchMovieDetails() {
    try {
        if (!movieId) {
            document.getElementById('movie-content').innerHTML = '<div class="alert alert-danger">Movie ID is missing. Please return to the home page.</div>';
            return;
        }

        const detailsUrl = `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=en-US`;
        const creditsUrl = `${BASE_URL}/movie/${movieId}/credits?api_key=${API_KEY}&language=en-US`;
        const similarUrl = `${BASE_URL}/movie/${movieId}/similar?api_key=${API_KEY}&language=en-US`;
        const videoUrl = `${BASE_URL}/movie/${movieId}/videos?api_key=${API_KEY}&language=en-US`;

        const [detailsRes, creditsRes, similarRes, videoRes] = await Promise.all([
            fetch(detailsUrl),
            fetch(creditsUrl),
            fetch(similarUrl),
            fetch(videoUrl)
        ]);

        const movie = await detailsRes.json();
        const credits = await creditsRes.json();
        const similar = await similarRes.json();
        const videos = await videoRes.json();

        if (!movie || movie.success === false) {
            document.getElementById('movie-content').innerHTML = '<div class="alert alert-danger">Movie not found or API error occurred.</div>';
            return;
        }

        const backdropPath = movie.backdrop_path 
            ? `url('https://image.tmdb.org/t/p/original${movie.backdrop_path}')`
            : 'url("/images/default-backdrop.jpg")';
            
        const posterPath = movie.poster_path 
            ? IMAGE_URL + movie.poster_path
            : '/images/default-poster.jpg';

        const director = credits.crew.find(person => person.job === 'Director')?.name || 'Unknown';
        const castHTML = credits.cast.slice(0, 10).map(actor => `
            <div class="col">
                <div class="card bg-dark text-light border-secondary shadow-sm cast-card">
                    <img src="${actor.profile_path ? IMAGE_URL + actor.profile_path : 'https://via.placeholder.com/150'}" class="card-img-top" alt="${actor.name}">
                    <div class="card-body text-center">
                        <h5 class="card-title">${actor.name}</h5>
                        <p class="card-text text-muted">${actor.character}</p>
                    </div>
                </div>
            </div>
        `).join('');

        const similarHTML = similar.results.slice(0, 8).map(sim => `
            <div class="col">
                <div class="card bg-dark text-light shadow-sm border-secondary border-1 similar-movie-card" onclick="window.location.href='movie.html?id=${sim.id}'">
                    <img 
                        src="${sim.poster_path ? IMAGE_URL + sim.poster_path : '/images/default-poster.jpg'}" 
                        class="card-img-top" 
                        alt="${sim.title}" 
                        onerror="this.onerror=null; this.src='/images/default-poster.jpg';"
                    />
                    <div class="card-body d-flex flex-column justify-content-between p-3">
                        <h6 class="card-title text-center text-wrap">
                            ${sim.title}
                        </h6>
                        <div class="">
                            <button class="btn btn-sm btn-outline-light w-100" data-id="${sim.id}">
                            <i class="far fa-bookmark me-2"></i>Watchlist
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        const genres = movie.genres.map(g => `<span class="genre-badge">${g.name}</span>`).join('');

        const trailer = videos.results.find(v => v.type === "Trailer" && v.site === "YouTube");
        const trailerEmbed = trailer ? `<iframe width="100%" height="400" src="https://www.youtube.com/embed/${trailer.key}" frameborder="0" allowfullscreen></iframe>` : `<p>No trailer available.</p>`;

        const movieHTML = `
        <div class="movie-banner" style="background-image: url('https://image.tmdb.org/t/p/original${movie.backdrop_path}');">
            <div class="container movie-info">
                <h1 class="display-4 fw-bold">${movie.title}</h1>
                <div class="movie-meta">
                    <span><i class="far fa-calendar-alt me-2"></i> ${movie.release_date.split('-')[0]}</span>
                    <span><i class="far fa-clock me-2"></i> ${movie.runtime} min</span>
                    <span><i class="fas fa-star text-warning me-2"></i> ${avgRating.toFixed(1)}/5</span>
                    <span><i class="fas fa-user me-2"></i> Director: ${director}</span>
                </div>
                <div class="mb-3">${genres}</div>
                <div class="action-buttons mt-4">
                    <button class="btn btn-primary"><i class="fas fa-play me-2"></i>Watch Now</button>
                    <button class="btn btn-outline-light" id="bookmarkBtn">
                        <i class="far fa-bookmark me-2"></i> Watchlist
                    </button>
                    <button class="btn btn-outline-light"><i class="fas fa-share-alt me-2"></i>Share</button>
                </div>
            </div>
        </div>

        <div class="container mt-5">
            <div class="mb-5">
                <h3 class="section-header text-uppercase">Synopsis</h3>
                <p class="lead">${movie.overview || 'No synopsis available.'}</p>
            </div>

            <div class="mb-5">
                <h3 class="section-header text-uppercase">Trailer</h3>
                <div class="trailer-container">${trailerEmbed}</div>
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
                    <div class="row row-cols-2 row-cols-md-3 row-cols-lg-5 g-4">${castHTML}</div>
                </div>

            <div class="tab-pane fade" id="reviews" role="tabpanel" aria-labelledby="reviews-tab">
                    <form id="review-form">
                        <div class="rating">
                            <label for="stars">Rate this movie:</label>
                            <div class="stars" id="stars">
                                <span class="star" data-value="1">★</span>
                                <span class="star" data-value="2">★</span>
                                <span class="star" data-value="3">★</span>
                                <span class="star" data-value="4">★</span>
                                <span class="star" data-value="5">★</span>
                            </div>
                            <div class="rating-number">
                                <span id="rating-number">0</span>/5.0
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="comment">Leave a comment:</label>
                            <textarea id="comment" class="form-control" rows="4" placeholder="Write your comment here..."></textarea>
                        </div>
                        <button type="submit" class="buttonPost btn mt-3" id="postButton">Submit</button>
                    </form>

                     <p id="comment-count" class="text-muted mt-3"></p>

                    <div id="review-list"></div>
                </div>


                <div class="tab-pane fade" id="similar" role="tabpanel">
                    <div class="row row-cols-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5 row-cols-xxl-6 g-4">${similarHTML}</div>
                </div>
            </div>
        </div>`;

        document.getElementById('movie-content').innerHTML = movieHTML;

        setupBookmarkButton(movie);
        setupSimilarMoviesButtons(similar.results, movie);

        
        // Star ratings
        let selectedRating = 0;
        const ratingDisplay = document.getElementById('rating-number'); 

        document.querySelectorAll('.star').forEach(star => {
            star.addEventListener('click', () => {
                selectedRating = parseInt(star.dataset.value);
                document.querySelectorAll('.star').forEach(s => s.classList.remove('selected'));
                for (let i = 0; i < selectedRating; i++) {
                    document.querySelectorAll('.star')[i].classList.add('selected');
                }
                ratingDisplay.textContent = selectedRating.toFixed(1);
            });
        });

        function updateRatingNumber(rating) {
            ratingDisplay.textContent = rating.toFixed(1);
        }

        // Handle review submission
        document.getElementById('review-form').addEventListener('submit', function (e) {
            e.preventDefault();  

            const text = document.getElementById('comment').value.trim();
            if (selectedRating === 0 || text === '') {
                alert('Please provide a rating and review text.');
                return;
            }

            saveReview(movieId, selectedRating, text);
            loadReviews(); 

            // Reset the form and rating display
            document.getElementById('review-form').reset();
            selectedRating = 0;
            document.querySelectorAll('.star').forEach(s => s.classList.remove('selected'));
            updateRatingNumber(0); 
        });

        // Save review to localStorage with movieId
        function saveReview(movieId, rating, reviewText) {
            const reviews = JSON.parse(localStorage.getItem('movie-reviews')) || [];
            const review = {
                username: 'Alice123',
                movieId, 
                rating,
                text: reviewText,
                date: new Date().toLocaleString(), 
            };
            reviews.push(review);
            localStorage.setItem('movie-reviews', JSON.stringify(reviews));
        }

        // Load reviews from localStorage 
        function loadReviews() {
            const reviews = JSON.parse(localStorage.getItem('movie-reviews')) || [];
            const reviewList = document.getElementById('review-list');
            const commentCount = document.getElementById('comment-count');
            reviewList.innerHTML = ''; 

            const movieReviews = reviews.filter(review => review.movieId === movieId);

            movieReviews.sort((a, b) => new Date(b.date) - new Date(a.date));

            if (movieReviews.length === 0) {
                commentCount.textContent = 'No comments yet';
            } else if (movieReviews.length === 1) {
                commentCount.textContent = '1 comment has been posted';
            } else {
                commentCount.textContent = `${movieReviews.length} comments have been posted`;
            }

            movieReviews.forEach(review => {
                const reviewHTML = `
                    <div class="review">
                        <div class="review-user"><strong>${review.username}</strong></div> <!-- Display username -->
                        <div class="review-rating">
                            ${'★'.repeat(review.rating).split('').map(() => '<span class="gold-star">★</span>').join('')}
                            ${'☆'.repeat(5 - review.rating).split('').map(() => '<span class="empty-star">☆</span>').join('')}
                        </div>
                        <div class="review-text">${review.text}</div>
                        <div class="review-date text-muted">${review.date}</div> <!-- This shows the date and time -->
                    </div>
                `;
                reviewList.innerHTML += reviewHTML; 
            });
        }

        loadReviews();
        
    } catch (error) {
        console.error("Failed to fetch movie details:", error);
        document.getElementById('movie-content').innerHTML = `
            <div class="container mt-5">
                <div class="alert alert-danger">
                    <h4>Error Loading Movie Details</h4>
                    <p>We couldn't load this movie's information. Please try again later.</p>
                    <button class="btn btn-outline-danger" onclick="window.location.reload()">Retry</button>
                </div>
            </div>`;
    }
}

function getAverageRating(movieId) {
    const reviews = JSON.parse(localStorage.getItem('movie-reviews')) || [];
    const movieReviews = reviews.filter(review => review.movieId === movieId);
    
    if (movieReviews.length === 0) return 0;

    const total = movieReviews.reduce((sum, review) => sum + review.rating, 0);
    return total / movieReviews.length;
}


function setupBookmarkButton(movie) {
    const bookmarkBtn = document.getElementById('bookmarkBtn');
    if (bookmarkBtn) {
        if (isInWatchlist(movieId)) {
            bookmarkBtn.classList.add('active');
            bookmarkBtn.innerHTML = '<i class="fas fa-bookmark me-2"></i> Added';
        }

        bookmarkBtn.addEventListener('click', () => {
            toggleWatchlistForDetailPage(bookmarkBtn, movieId, {
                id: String(movieId),
                title: movie.title,
                year: movie.release_date ? movie.release_date.split('-')[0] : 'N/A',
                description: movie.overview || 'No description available',
                img: movie.poster_path ? IMAGE_URL + movie.poster_path : '/images/default-poster.jpg',
                rating: movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A',
                watched: false
            });
        });
    }
}

function setupSimilarMoviesButtons(similarMovies) {
    document.querySelectorAll('.similar-movie-card .btn').forEach(btn => {
        const similarId = btn.getAttribute('data-id');
        const similarMovie = similarMovies.find(m => String(m.id) === similarId);
        
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
    const movieIndex = watchlist.findIndex(m => m.id === movieId);

    if (movieIndex === -1) {
        watchlist.push(movie);
        buttonElement.classList.add('active');
        buttonElement.innerHTML = '<i class="fas fa-bookmark me-2"></i> Added';
        buttonElement.setAttribute('data-watchlisted', 'true');
        showToast('Added to Watchlist');
    } else {
        watchlist.splice(movieIndex, 1);
        buttonElement.classList.remove('active');
        buttonElement.innerHTML = '<i class="far fa-bookmark me-2"></i> Watchlist';
        buttonElement.setAttribute('data-watchlisted', 'false');
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

document.addEventListener('DOMContentLoaded', fetchMovieDetails);

