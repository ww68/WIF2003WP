// Constants
const TMDB_API_KEY = 'b5ca748da01c92488ef670a84e31c784';
const API_BASE = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w200';

let currentPage = 1;
let currentQuery = '';
const genreMap = {};
let availableGenres = [];
let availableLanguages = [];

// Fetch genres and languages
Promise.all([
  fetch(`${API_BASE}/genre/movie/list?api_key=${TMDB_API_KEY}`).then(res => res.json()),
  fetch(`${API_BASE}/configuration/languages?api_key=${TMDB_API_KEY}`).then(res => res.json())
]).then(([genreData, languageData]) => {
  genreData.genres.forEach(g => {
    genreMap[g.id] = g.name;
    availableGenres.push({ id: g.id, name: g.name });
  });
  availableLanguages = languageData;
  populateDropdowns();

  const urlParams = new URLSearchParams(window.location.search);
  const initialQuery = urlParams.get("query");
document.getElementById("searchQuery").value = initialQuery || '';
if (initialQuery) {
  searchMovies(initialQuery);
} else {
  loadTrending();
}
});

function populateDropdowns() {
  const genreSelect = document.getElementById('filterGenre');
  const langSelect = document.getElementById('filterLanguage');

  genreSelect.innerHTML = `<option value="">Any</option>`;
  availableGenres.forEach(g => {
    const option = document.createElement('option');
    option.value = g.id;
    option.textContent = g.name;
    genreSelect.appendChild(option);
  });

  langSelect.innerHTML = `<option value="">Any</option>`;
  availableLanguages.forEach(l => {
    const option = document.createElement('option');
    option.value = l.iso_639_1;
    option.textContent = `${l.english_name} (${l.iso_639_1})`;
    langSelect.appendChild(option);
  });
}

function loadTrending() {
  fetch(`${API_BASE}/trending/movie/day?api_key=${TMDB_API_KEY}`)
    .then(res => res.json())
    .then(data => renderMovies(data.results));
}

function renderMovies(movies) {
  const container = document.getElementById('resultsContainer');
  container.innerHTML = '';
  if (!movies || movies.length === 0) {
    container.innerHTML = `<p class="text-white">No results found.</p>`;
    return;
  }
  movies.forEach(movie => {
    const poster = movie.poster_path ? `${IMG_BASE}${movie.poster_path}` : 'https://via.placeholder.com/80x120' || images/fallback.png;
    const title = movie.title || 'Untitled';
    const overview = movie.overview || 'No description available.';
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
    const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : 'Unknown Year';
    const genres = movie.genre_ids?.map(id => genreMap[id]).filter(Boolean).join(', ') || 'Unknown Genre';

    const movieCard = document.createElement('div');
    movieCard.className = 'col-12 col-sm-6 col-md-4 col-lg-3 movie-list-item';
    movieCard.setAttribute('movie-id', movie.id);
    movieCard.innerHTML = `
      <div class="card movie-card bg-dark text-white shadow-sm mb-4">
        <div class="img-wrapper">
          <img 
            src="${movie.poster_path ? `${IMG_BASE}${movie.poster_path}` : 'images/fallback.png'}" 
            alt="${title}" 
            class="movie-list-item-img card-img-top"
            onerror="this.onerror=null;this.src='images/fallback.png';"
          >
        </div>
        <div class="card-body d-flex flex-column justify-content-between">
          <div>
            <h5 class="card-title movie-list-item-title mb-1">${title}</h5>
            <p class="mb-1"><small class="text-muted">${releaseYear}</small></p>
            <p class="mb-1"><small class="text-info">${genres}</small></p>
            <p class="truncate-description movie-list-item-desc">${overview}</p>
          </div>
          <div class="d-flex justify-content-between align-items-center mt-2">
            <span class="rating-star"><i class="fas fa-star text-warning"></i> ${rating}</span>
            <div class="bookmark-wrapper">
              <div class="bookmark-circle d-flex align-items-center justify-content-center">
                <i class="fa-solid fa-bookmark bookmark-icon"></i>
              </div>
            </div>
            <a href="movie.html?id=${movie.id}" class="btn btn-sm btn-primary">Watch</a>
          </div>
        </div>
      </div>
    `;

    container.appendChild(movieCard);
  });
  attachWatchlistListeners(container);
}

function attachWatchlistListeners(container) {
  const items = container.querySelectorAll('.movie-list-item');
  const watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
  items.forEach(item => {
    const movieId = item.getAttribute('movie-id');
    const icon = item.querySelector('.bookmark-icon');
    if (watchlist.find(m => m.id == movieId)) icon.classList.add('active');
    icon.addEventListener('click', () => toggleWatchlist(icon, movieId));
  });
}

function toggleWatchlist(iconElement, movieId) {
  let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
  const movieItem = iconElement.closest('.movie-list-item');
  const movieData = {
    id: movieId,
    title: movieItem.querySelector('.movie-list-item-title')?.textContent || 'Unknown Title',
    year: new Date().getFullYear(),
    description: movieItem.querySelector('.movie-list-item-desc')?.textContent || '',
    img: movieItem.querySelector('.movie-list-item-img')?.getAttribute('src') || '',
    rating: "7.0",
    watched: false
  };
  const index = watchlist.findIndex(movie => movie.id === movieId);
  if (index === -1) {
    watchlist.push(movieData);
    iconElement.classList.add('active');
    showToast('Added to Watchlist');
  } else {
    watchlist.splice(index, 1);
    iconElement.classList.remove('active');
    showToast('Removed from Watchlist');
  }
  localStorage.setItem('watchlist', JSON.stringify(watchlist));
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.querySelector('.toast-body').textContent = message;
  const toastInstance = new bootstrap.Toast(toast);
  toastInstance.show();
}

function storeRecentSearch(query) {
  let searches = JSON.parse(localStorage.getItem('recentSearches')) || [];
  query = query.trim();
  if (!searches.includes(query)) {
    searches.unshift(query);
    if (searches.length > 5) searches.pop();
    localStorage.setItem('recentSearches', JSON.stringify(searches));
  }
}
function searchMovies(query) {
  currentQuery = query || document.getElementById("searchQuery").value.trim();
  const genre = document.getElementById('filterGenre').value;
  const year = document.getElementById('filterYear').value;
  const minDuration = document.getElementById('filterMinDuration').value;
  const maxDuration = document.getElementById('filterMaxDuration').value;
  const language = document.getElementById('filterLanguage').value;
  storeRecentSearch(currentQuery);

  // Update header text
  const header = document.getElementById("searchHeader");
  if (header) {
    header.textContent = currentQuery 
      ? `Search results for "${currentQuery}"`
      : "Trending Movies";
  }

  let url;
  if (currentQuery) {
    // Use search endpoint for text queries
    url = `${API_BASE}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(currentQuery)}&page=${currentPage}`;
    
    // Add filters to search endpoint if needed
    if (year) url += `&year=${year}`;
    if (language) url += `&language=${language}`;
  } else {
    // Use discover endpoint for filtered browsing
    url = `${API_BASE}/discover/movie?api_key=${TMDB_API_KEY}&page=${currentPage}`;
    if (genre) url += `&with_genres=${genre}`;
    if (year) url += `&primary_release_year=${year}`;
    if (language) url += `&with_original_language=${language}`;
    if (minDuration) url += `&with_runtime.gte=${minDuration}`;
    if (maxDuration) url += `&with_runtime.lte=${maxDuration}`;
  }

  fetch(url)
    .then(res => res.json())
    .then(data => {
      renderMovies(data.results || []);
    })
    .catch(error => {
      console.error('Error fetching movies:', error);
      document.getElementById('resultsContainer').innerHTML = `
        <p class="text-white">Error loading results. Please try again.</p>
      `;
    });
}

// Filter modal
const applyBtn = document.getElementById('applyFiltersBtn');
const resetBtn = document.createElement('button');
resetBtn.className = 'btn btn-secondary ms-2';
resetBtn.textContent = 'Reset';
resetBtn.onclick = () => {
  document.getElementById('filterGenre').value = '';
  document.getElementById('filterYear').value = '';
  document.getElementById('filterActor').value = '';
  document.getElementById('filterMinDuration').value = '';
  document.getElementById('filterMaxDuration').value = '';
  document.getElementById('filterLanguage').value = '';
};
applyBtn.parentNode.insertBefore(resetBtn, applyBtn.nextSibling);

applyBtn.addEventListener('click', () => {
  const query = document.getElementById("searchQuery").value;
  currentPage = 1;
  searchMovies(query);
  const modal = bootstrap.Modal.getInstance(document.getElementById('filterModal'));
  modal.hide();
});

// Pagination
['prevPage', 'nextPage'].forEach(btnId => {
  document.getElementById(btnId).addEventListener('click', e => {
    e.preventDefault();
    if (btnId === 'prevPage' && currentPage > 1) currentPage--;
    if (btnId === 'nextPage') currentPage++;
    searchMovies();
  });
});

