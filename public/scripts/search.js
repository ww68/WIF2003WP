// Constants
const TMDB_API_KEY = 'b5ca748da01c92488ef670a84e31c784';
const API_BASE = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';

let currentPage = 1;
let currentQuery = '';
const genreMap = {};
let availableGenres = [];
let availableLanguages = [];

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize search form with dropdown
    const searchForm = document.querySelector('form[role="search"]');
    if (searchForm) {
        const input = searchForm.querySelector('input[type="search"]');
        
        // Create dropdown for suggestions
        const dropdown = document.createElement("ul");
        dropdown.className = "list-group w-100 shadow";
        dropdown.style.position = "absolute";
        dropdown.style.top = "100%";
        dropdown.style.left = "0";
        dropdown.style.zIndex = 1050;
        dropdown.style.display = "none";
        dropdown.style.backgroundColor = "#212529";
        dropdown.style.border = "1px solid #343a40";
        searchForm.style.position = "relative";
        searchForm.appendChild(dropdown);

        // Load suggestions from DB
        const loadSuggestions = async () => {
        const searches = await loadRecentSearches();
        dropdown.innerHTML = "";
        
        if (searches.length === 0) {
            dropdown.style.display = "none";
            return;
        }

        searches.slice(0, 5).forEach(search => {
            const li = document.createElement("li");
            li.className = "list-group-item d-flex justify-content-between align-items-center bg-dark text-white border-secondary";

            const text = document.createElement("span");
            text.textContent = search.query;
            text.className = "flex-grow-1";
            text.style.cursor = "pointer";
            text.onclick = () => {
                input.value = search.query;
                currentQuery = search.query;
                currentPage = 1;
                dropdown.style.display="none";
                updateSearch();
            };

            const deleteBtn = document.createElement("button");
            deleteBtn.innerHTML = `<i class="fas fa-trash-alt text-white"></i>`;
            deleteBtn.className = "btn deleteBtn p-1";
            deleteBtn.onmousedown = (e) => e.preventDefault();
            deleteBtn.onfocus = (e) => e.target.style.background = "transparent";
            deleteBtn.onclick = async (e) => {
                e.stopPropagation();
                const success = await deleteSearchHistory(search.query);
                if (success) {
                    loadSuggestions();
                }
            };
            li.appendChild(text);
            li.appendChild(deleteBtn);
            dropdown.appendChild(li);
        });

        dropdown.style.display = "block";
    };

        // Auto-suggestions while typing
      input.addEventListener("input", () => {
    const query = input.value.trim();

    if (query === "") {
        loadSuggestions();
        return;
    }

    fetch(`/search/suggestions?query=${encodeURIComponent(query)}`) // ✅ Use backend
        .then(res => res.json())
        .then(titles => {
            dropdown.innerHTML = "";

            titles.slice(0, 5).forEach(title => {
                const li = document.createElement("li");
                li.className = "list-group-item d-flex justify-content-between align-items-center bg-dark text-white";

                const text = document.createElement("span");
                text.textContent = title;
                text.className = "flex-grow-1";
                text.style.cursor = "pointer";
                text.onclick = () => {
                    input.value = title;
                    dropdown.style.display = "none";
                    form.requestSubmit();
                };

                li.appendChild(text);
                dropdown.appendChild(li);
            });

            dropdown.style.display = "block";
        })
        .catch(err => {
            console.error("Error fetching suggestions from backend:", err);
        });
});



        // Show recent searches on focus
        input.addEventListener("focus", loadSuggestions);

        // Hide dropdown when clicking outside
        document.addEventListener("click", e => {
            if (!searchForm.contains(e.target)) {
                dropdown.style.display = "none";
            }
        });

        // Update search on form submit
       searchForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        currentQuery = input.value.trim();
        currentPage = 1;
        
        // Save to search history
        await saveSearchHistory(currentQuery, {
            genre: document.getElementById('filterGenre')?.value || '',
            year: document.getElementById('filterYear')?.value || '',
            language: document.getElementById('filterLanguage')?.value || ''
        });
        
        dropdown.style.display = "none";
        updateSearch();
    });
    }

    // Load genres and languages
    Promise.all([
        fetch(`${API_BASE}/genre/movie/list?api_key=${TMDB_API_KEY}`).then(res => res.json()),
        fetch(`${API_BASE}/configuration/languages?api_key=${TMDB_API_KEY}`).then(res => res.json())
    ]).then(([genreData, languageData]) => {
        // Populate genre map
        genreData.genres.forEach(g => {
            genreMap[g.id] = g.name;
            availableGenres.push({ id: g.id, name: g.name });
        });
        availableLanguages = languageData;
        
        // Populate dropdowns
        populateDropdowns();
        
        // Get initial query from URL
        const urlParams = new URLSearchParams(window.location.search);
        currentQuery = urlParams.get("query") || '';
        
        // Update search input if exists
        const searchInput = document.querySelector('input[type="search"]');
        if (searchInput) searchInput.value = currentQuery;
        
        // Initial load
        updateSearch();
    });

    // Setup filters
    setupFilters();
    setupPagination();
    setupVoiceSearch();
});

// Voice Search
function setupVoiceSearch() {
    const voiceBtns = document.querySelectorAll('.voiceBtn');
    
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        voiceBtns.forEach(btn => {
            btn.disabled = true;
            btn.title = "Voice search not supported in your browser";
        });
        return;
    }

     const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    voiceBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const searchInput = this.closest('form').querySelector('input[type="search"]');
            
            // Visual feedback
            this.innerHTML = '<i class="bi bi-mic-mute-fill"></i>';
            this.classList.add('active');
            
            recognition.start();
            
            recognition.onresult = async function(event) {
                const transcript = event.results[0][0].transcript;
                searchInput.value = transcript;
                currentQuery = transcript;
                currentPage = 1;
                
                // Save voice search to history
                await saveSearchHistory(transcript, {});
                updateSearch();
            };
            
            recognition.onerror = function(event) {
                console.error('Voice recognition error', event.error);
                showToast('Voice search error: ' + event.error);
            };
            
            recognition.onend = function() {
                btn.innerHTML = '<i class="bi bi-mic-fill"></i>';
                btn.classList.remove('active');
            };
        });
    });
}

function populateDropdowns() {
    const genreSelect = document.getElementById('filterGenre');
    const langSelect = document.getElementById('filterLanguage');

    if (genreSelect) {
        genreSelect.innerHTML = `<option value="">Any Genre</option>`;
        availableGenres.forEach(g => {
            const option = document.createElement('option');
            option.value = g.id;
            option.textContent = g.name;
            genreSelect.appendChild(option);
        });
    }

    if (langSelect) {
        langSelect.innerHTML = `<option value="">Any Language</option>`;
        availableLanguages.forEach(l => {
            const option = document.createElement('option');
            option.value = l.iso_639_1;
            option.textContent = `${l.english_name} (${l.iso_639_1})`;
            langSelect.appendChild(option);
        });
    }
}

function updateSearch() {
    const genre = document.getElementById('filterGenre')?.value || '';
    const year = document.getElementById('filterYear')?.value || '';
    const language = document.getElementById('filterLanguage')?.value || '';

    // Save to history if there's a query or filters
    if (currentQuery || genre || year || language) {
        saveSearchHistory(currentQuery, { genre, year, language });
    }

    const minDuration = document.getElementById('filterMinDuration')?.value || '';
    const maxDuration = document.getElementById('filterMaxDuration')?.value || '';
    const minRating = document.getElementById('filterRating')?.value || '';
    
    const hasFilters = genre || year || minDuration || maxDuration || language || minRating;
    
    if (hasFilters || currentQuery) {
        searchMovies();
    } else {
        loadTrending();
    }
}

function loadTrending() {
    fetch(`${API_BASE}/trending/movie/day?api_key=${TMDB_API_KEY}`)
        .then(res => res.json())
        .then(data => {
            updateHeader("Trending Movies");
            renderMovies(data.results);
        })
        .catch(error => {
            console.error('Error loading trending movies:', error);
            showError();
        });
}

function searchMovies() {
    const genre = document.getElementById('filterGenre')?.value || '';
    const year = document.getElementById('filterYear')?.value || '';
    const minDuration = document.getElementById('filterMinDuration')?.value || '';
    const maxDuration = document.getElementById('filterMaxDuration')?.value || '';
    const language = document.getElementById('filterLanguage')?.value || '';
    const minRating = document.getElementById('filterRating')?.value || '';

    // Update URL without reloading
    const params = new URLSearchParams();
    if (currentQuery) params.set('query', currentQuery);
    if (genre) params.set('genre', genre);
    if (year) params.set('year', year);
    if (language) params.set('language', language);
    if (minRating) params.set('rating', minRating);
    if (minDuration) params.set('minDuration', minDuration);
    if (maxDuration) params.set('maxDuration', maxDuration);
    params.set('page', currentPage);

    window.history.pushState({}, '', `search.html?${params.toString()}`);

    // Update header
    updateHeader(currentQuery ? `Search results for "${currentQuery}"` : "Browse Movies");

    // Call backend to get results
    fetch(`/search/results?${params.toString()}`)
        .then(res => res.json())
        .then(data => {
            let results = data.results || [];

            // For TMDB's `/search/movie`, we filter manually for filters not supported natively
            if (currentQuery) {
                if (genre) results = results.filter(movie => movie.genre_ids?.includes(Number(genre)));
                if (year) results = results.filter(movie => movie.release_date?.startsWith(year));
                if (language) results = results.filter(movie => movie.original_language === language);
                if (minRating) results = results.filter(movie => movie.vote_average >= Number(minRating));
                if (minDuration) results = results.filter(movie => movie.runtime >= Number(minDuration));
                if (maxDuration) results = results.filter(movie => movie.runtime <= Number(maxDuration));
            }

            renderMovies(results);
            updatePagination(data.total_pages || 1);
        })
        .catch(error => {
            console.error('Error fetching movies from backend:', error);
            showError();
        });
}


// Rest of the functions (renderMovies, checkWatchlistStatus, addToWatchlist, etc.) remain the same...
// [Previous implementations of these functions can stay unchanged]
function renderMovies(movies) {
    const container = document.getElementById('resultsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    if (!movies || movies.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center mt-5 p-3">
                <img src="https://cdn-icons-png.flaticon.com/512/4076/4076549.png" alt="No Results" width="120" class="mb-3">
                <p class="text-muted mb-4">No results found. Try different search terms or filters.</p>
            </div>
        `;
        return;
    }

    movies.forEach(movie => {
        const poster = movie.poster_path ? `${IMG_BASE}${movie.poster_path}` : '/images/fallback.png';
        const title = movie.title || 'Untitled';
        const overview = movie.overview || 'No description available.';
        const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
        const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : 'Unknown Year';
        
        // Get genre names from genre_ids
        const genres = movie.genre_ids?.map(id => genreMap[id]).filter(Boolean);
        // Limit to 3 genres to avoid overcrowding
        const displayedGenres = genres?.slice(0, 3).join(', ') || 'Unknown Genre';

        const movieCard = document.createElement('div');
        movieCard.className = 'col-sm-12 col-md-6 col-xl-4 movie-card';
        movieCard.setAttribute('data-id', movie.id);
        movieCard.innerHTML = `
            <div class="card h-100 text-white">
                <div class="position-absolute top-0 start-0 m-2">
                    <div class="bookmark-circle d-flex align-items-center justify-content-center">
                        <i class="fa-solid fa-bookmark fs-6 bookmark-icon"
                            onclick="addToWatchlist('${movie.id}', '${title.replace(/'/g, "\\'")}', '${overview.replace(/'/g, "\\'")}', '${poster}', '${rating}', '${releaseYear}')">
                        </i> 
                    </div>
                </div>
                <div class="row g-0 d-flex align-items-stretch">
                    <div class="col-4">
                        <div class="img-wrapper h-100">
                            <img src="${poster}" 
                                onerror="this.onerror=null; this.src='/images/fallback.png';" 
                                class="img-fluid rounded-start" 
                                alt="${title}">
                        </div>
                    </div>
                    <div class="col-8 card-body-side">
                        <div class="movie-title-block">
                            <h5 class="card-title">${title}</h5> 
                        </div>
                        <div class="d-flex align-items-center gap-2 mb-2 text-muted small text-nowrap">
                            <span>${releaseYear}</span>
                            <span>|</span>
                            <span class="d-flex align-items-center">
                                <i class="fas fa-star text-warning me-1"></i>${rating}
                            </span>
                        </div>
                        <div class="mb-2">
                            <small class="text-muted">${displayedGenres}</small>
                        </div>
                        <p class="card-text truncate-description">${overview}</p>
                        <div class="mt-auto">
                            <a href="/movie/${movie.id}" class="btn btn-primary w-100">
                                <i class="fab fa-netflix me-2"></i>Watch now
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;

        container.appendChild(movieCard);
        checkWatchlistStatus(movie.id);
    });
}


async function checkWatchlistStatus(movieId) {
    try {
        const response = await fetch(`/watchlist/check/${movieId}`, {
            headers: {
                'Accept': 'application/json'
            },
            credentials: 'include',
            redirect: 'manual'
        });
        
        if (response.status === 200) {
            const result = await response.json();
        
            if (result.inWatchlist) {
                const bookmark = document.querySelector(`.movie-card[data-id="${movieId}"] .bookmark-icon`);
                if (bookmark) {
                    bookmark.classList.add('text-warning');
                }
            }
        }
    } catch (error) {
        console.error('Error checking watchlist status:', error);
    }
}

async function addToWatchlist(movieId, title, description, img, rating, year) {
    try {
        const movieData = {
            id: movieId,
            title: title,
            description: description,
            img: img,
            rating: rating,
            year: year,
            watched: false
        };

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

        if (response.status === 401 || response.status === 302) {
            promptLogin('Please log in to add movies to your watchlist.');
            return;
        }
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Added to watchlist');
            const bookmark = document.querySelector(`.movie-card[data-id="${movieId}"] .bookmark-icon`);
            if (bookmark) {
                bookmark.classList.add('text-warning');
            }
        } else {
            showToast(result.message || 'Movie already in watchlist');
        }
    } catch (error) {
        console.error('Error adding to watchlist:', error);
        showToast('Error adding to watchlist');
    }
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast align-items-center text-white bg-success border-0 position-fixed bottom-0 end-0 m-3';
    toast.style.zIndex = '2000';
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    document.body.appendChild(toast);
    
    const toastInstance = new bootstrap.Toast(toast);
    toastInstance.show();
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function updateHeader(text) {
    const header = document.getElementById("searchHeader");
    if (header) header.textContent = text;
}

function updatePagination(totalPages) {
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');

    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
    if (pageInfo) pageInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`;
}

function setupFilters() {
    const applyBtn = document.getElementById('applyFiltersBtn');
    if (!applyBtn) return;

    const resetBtn = document.createElement('button');
    resetBtn.className = 'btn btn-secondary ms-2';
    resetBtn.textContent = 'Reset';
    resetBtn.onclick = () => {
        document.getElementById('filterGenre').value = '';
        document.getElementById('filterYear').value = '';
        document.getElementById('filterMinDuration').value = '';
        document.getElementById('filterMaxDuration').value = '';
        document.getElementById('filterLanguage').value = '';
        document.getElementById('filterRating').value = '';
        currentPage = 1;
        updateSearch();
    };
    
    applyBtn.parentNode.insertBefore(resetBtn, applyBtn.nextSibling);

    applyBtn.addEventListener('click', () => {
        currentPage = 1;
        updateSearch();
        const modal = bootstrap.Modal.getInstance(document.getElementById('filterModal'));
        if (modal) modal.hide();
    });

    // Initialize filters from URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('genre')) document.getElementById('filterGenre').value = urlParams.get('genre');
    if (urlParams.has('year')) document.getElementById('filterYear').value = urlParams.get('year');
    if (urlParams.has('language')) document.getElementById('filterLanguage').value = urlParams.get('language');
    if (urlParams.has('rating')) document.getElementById('filterRating').value = urlParams.get('rating');
}

function setupPagination() {
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');

    if (prevBtn) {
        prevBtn.addEventListener('click', e => {
            e.preventDefault();
            if (currentPage > 1) {
                currentPage--;
                updateSearch();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', e => {
            e.preventDefault();
            currentPage++;
            updateSearch();
        });
    }
}

function showError() {
    const container = document.getElementById('resultsContainer');
    if (container) {
        container.innerHTML = `
            <div class="col-12 text-center mt-5 p-3">
                <i class="fas fa-exclamation-triangle text-danger mb-3" style="font-size: 3rem;"></i>
                <p class="text-muted mb-4">Error loading results. Please try again.</p>
            </div>
        `;
    }
}

function promptLogin(msg='Please log in to view your watchlist.') {
  if (typeof showAuthModal === 'function') {
    showAuthModal(msg);
  } else {
    window.location.href = '/login';
  }
}


// scripts/search.js
async function saveSearchHistory(query, filters = {}) {
    try {
        console.group('💾 Saving search history');
        console.log('Query:', query);
        console.log('Filters:', filters);

        const response = await fetch('/search/history', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query,
                genre: filters.genre || '',
                year: filters.year || '',
                language: filters.language || ''
            }),
            credentials: 'include'
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            const error = await response.json();
            console.error('Save failed:', error);
            console.groupEnd();
            return false;
        }

        const data = await response.json();
        console.log('Save successful:', data);
        console.groupEnd();
        return true;
    } catch (error) {
        console.error('Network error:', error);
        console.groupEnd();
        return false;
    }
}

async function loadRecentSearches() {
    try {
        console.log('🔍 Loading recent searches...');
        const response = await fetch('/search/history', {
            credentials: 'include'
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            console.error('Failed to fetch history');
            return [];
        }

        const data = await response.json();
        console.log('Received history:', data.history);
        return data.history || [];
    } catch (error) {
        console.error('Error loading searches:', error);
        return [];
    }
}

async function deleteSearchHistory(query) {
    try {
        console.log('🗑️ Deleting search:', query);
        const response = await fetch('/search/history', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query }),
            credentials: 'include'
        });
        
        return response.ok;
    } catch (error) {
        console.error('Error deleting search:', error);
        return false;
    }
}

// Update the dropdown function to use DB searches
function updateRecentSearchesDropdown(searches) {
    const dropdown = document.querySelector('.search-dropdown');
    if (!dropdown) return;
    
    dropdown.innerHTML = searches.length 
        ? searches.map(search => `
            <a href="/search?query=${encodeURIComponent(search.query)}${search.filters.genre ? `&genre=${search.filters.genre}` : ''}${search.filters.year ? `&year=${search.filters.year}` : ''}${search.filters.language ? `&language=${search.filters.language}` : ''}" 
               class="dropdown-item">
                ${search.query}
                ${search.filters.genre || search.filters.year || search.filters.language ? 
                 `<small class="text-muted d-block">Filters: ${[search.filters.genre, search.filters.year, search.filters.language].filter(Boolean).join(', ')}</small>` : ''}
            </a>
        `).join('')
        : '<div class="dropdown-item">No recent searches</div>';
    
    dropdown.style.display = searches.length ? 'block' : 'none';
}
