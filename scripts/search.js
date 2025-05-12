const TMDB_API_KEY = 'b5ca748da01c92488ef670a84e31c784';
const API_BASE = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w200';


let currentPage = 1;
let currentQuery = '';
const genreMap = {};
let availableGenres = [];
let availableLanguages = [];


// Fetch genres and languages, then initialize
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
  if (initialQuery) {
    document.getElementById("searchInput").value = initialQuery;
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


// Load trending movies
function loadTrending() {
  fetch(`${API_BASE}/trending/movie/day?api_key=${TMDB_API_KEY}`)
    .then(res => res.json())
    .then(data => renderMovies(data.results));
}


// Render movie cards
function renderMovies(movies) {
  const container = document.getElementById('resultsContainer');
  container.innerHTML = '';


  if (!movies || movies.length === 0) {
    container.innerHTML = `<p class="text-white">No results found.</p>`;
    return;
  }


  movies.forEach(movie => {
    const poster = movie.poster_path ? `${IMG_BASE}${movie.poster_path}` : 'https://via.placeholder.com/80x120';
    const title = movie.title || 'Untitled';
    const overview = movie.overview || 'No description available.';
    const rating = movie.vote_average || 'N/A';


    const movieCard = document.createElement('div');
    movieCard.className = 'col-12 col-sm-6 col-md-4 col-lg-3 movie-list-item';
    movieCard.setAttribute('movie-id', movie.id);
const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : 'Unknown Year';
const genres = movie.genre_ids?.map(id => genreMap[id]).filter(Boolean).join(', ') || 'Unknown Genre';


movieCard.innerHTML = `
  <div class="card movie-card bg-dark text-white shadow-sm mb-4">
    <div class="img-wrapper">
      <img src="${poster || 'placeholder.jpg'}" alt="${title || 'No Title'}" class="movie-list-item-img card-img-top">
    </div>
    <div class="card-body d-flex flex-column justify-content-between">
      <div>
        <h5 class="card-title movie-list-item-title mb-1">${title || 'Unknown Title'}</h5>
        <p class="mb-1"><small class="text-muted">${releaseYear || 'Unknown Year'}</small></p>
        <p class="mb-1"><small class="text-info">${genres || 'Unknown Genres'}</small></p>
        <p class="truncate-description movie-list-item-desc">${overview || 'No description available.'}</p>
      </div>
      <div class="d-flex justify-content-between align-items-center mt-2">
        <span class="rating-star"><i class="fas fa-star text-warning"></i> ${rating || 'N/A'}</span>
        <div class="bookmark-wrapper">
          <div class="bookmark-circle d-flex align-items-center justify-content-center">
            <i class="fa-solid fa-bookmark bookmark-icon"></i>
          </div>
        </div>
        <a href="movie.html?id=${movie.id || '#'}" class="btn btn-sm btn-primary">Watch ▶</a>
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


    if (watchlist.find(m => m.id == movieId)) {
      icon.classList.add('active');
    }


    icon.addEventListener('click', () => toggleWatchlist(icon, movieId));
  });
}


function toggleWatchlist(iconElement, movieId) {
  let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
  const movieItem = iconElement.closest('.movie-list-item');


  const movieData = {
    id: movieId,
    title: movieItem.querySelector('.movie-list-item-title')?.textContent || 'Unknown Title',
    year: 2025,
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


function searchMovies(query = currentQuery) {
  currentQuery = query;
  storeRecentSearch(query);
  fetch(`${API_BASE}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${currentPage}`)
    .then(res => res.json())
    .then(data => renderMovies(data.results));
}


// Filter logic
document.getElementById('applyFiltersBtn').addEventListener('click', () => {
  const genre = document.getElementById('filterGenre').value;
  const year = document.getElementById('filterYear').value;
  const actor = document.getElementById('filterActor').value;
  const minDuration = document.getElementById('filterMinDuration').value;
  const maxDuration = document.getElementById('filterMaxDuration').value;
  const language = document.getElementById('filterLanguage').value;


  let url = `${API_BASE}/discover/movie?api_key=${TMDB_API_KEY}&page=${currentPage}`;


  if (genre) url += `&with_genres=${genre}`;
  if (year) url += `&primary_release_year=${year}`;
  if (language) url += `&with_original_language=${language}`;
  if (minDuration) url += `&with_runtime.gte=${minDuration}`;
  if (maxDuration) url += `&with_runtime.lte=${maxDuration}`;


  if (actor) {
    fetch(`${API_BASE}/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(actor)}`)
      .then(res => res.json())
      .then(data => {
        if (data.results.length > 0) {
          const actorId = data.results[0].id;
          url += `&with_cast=${actorId}`;
        }
        fetch(url)
          .then(res => res.json())
          .then(data => renderMovies(data.results));
      });
  } else {
    fetch(url)
      .then(res => res.json())
      .then(data => renderMovies(data.results));
  }


  const modal = bootstrap.Modal.getInstance(document.getElementById('filterModal'));
  modal.hide();
});


// Pagination
document.getElementById('prevPage').addEventListener('click', e => {
  e.preventDefault();
  if (currentPage > 1) {
    currentPage--;
    searchMovies();
  }
});
document.getElementById('nextPage').addEventListener('click', e => {
  e.preventDefault();
  currentPage++;
  searchMovies();
});


// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  const searchForms = document.querySelectorAll('form[role="search"]');


  searchForms.forEach(form => {
    const input = form.querySelector('input[type="search"]');
    const voiceBtn = form.querySelector('.voiceBtn');


    const dropdown = document.createElement("ul");
    dropdown.className = "list-group w-100 shadow";
    dropdown.style.position = "absolute";
    dropdown.style.top = "100%";
    dropdown.style.left = "0";
    dropdown.style.zIndex = 1050;
    dropdown.style.display = "none";
    form.style.position = "relative";
    form.appendChild(dropdown);


    const loadSuggestions = () => {
      dropdown.innerHTML = "";
      const recent = JSON.parse(localStorage.getItem("recentSearches") || "[]");
      if (recent.length === 0) return;


      recent.slice(0, 5).forEach(item => {
        const li = document.createElement("li");
        li.className = "list-group-item d-flex justify-content-between align-items-center bg-dark text-white";


        const text = document.createElement("span");
        text.textContent = item;
        text.className = "flex-grow-1";
        text.style.cursor = "pointer";
        text.onclick = () => {
          input.value = item;
          form.requestSubmit();
        };


        const deleteBtn = document.createElement("button");
        deleteBtn.innerHTML = "&times;";
        deleteBtn.className = "btn btn-sm btn-danger ms-2";
        deleteBtn.onclick = (e) => {
          e.stopPropagation();
          let recent = JSON.parse(localStorage.getItem("recentSearches") || "[]");
          recent = recent.filter(q => q !== item);
          localStorage.setItem("recentSearches", JSON.stringify(recent));
          loadSuggestions();
        };


        li.appendChild(text);
        li.appendChild(deleteBtn);
        dropdown.appendChild(li);
      });


      dropdown.style.display = "block";
    };


    input.addEventListener("focus", loadSuggestions);
    input.addEventListener("input", () => {
      if (input.value.trim() === "") {
        loadSuggestions();
      } else {
        dropdown.style.display = "none";
      }
    });


    document.addEventListener("click", e => {
      if (!form.contains(e.target)) {
        dropdown.style.display = "none";
      }
    });


    form.addEventListener("submit", e => {
      e.preventDefault();
      const query = input.value.trim();
      if (query) {
        currentPage = 1;
        storeRecentSearch(query);
        searchMovies(query);
      }
    });


    if (voiceBtn && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
      const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognition.lang = 'en-US';
      recognition.interimResults = false;


      voiceBtn.addEventListener('click', () => recognition.start());


      recognition.onresult = event => {
        const transcript = event.results[0][0].transcript;
        input.value = transcript;
        storeRecentSearch(transcript);
        searchMovies(transcript);
      };


      recognition.onerror = event => {
        alert(`Voice recognition error: ${event.error}`);
      };
    } else if (voiceBtn) {
      voiceBtn.disabled = true;
      voiceBtn.title = "Voice recognition not supported";
    }
  });
});
