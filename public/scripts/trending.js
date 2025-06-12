const API_KEY = '9a56291f8d522c5f874ed7812f062758';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/w200';
const GENRE_MAP = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy",
  80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family",
  14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music",
  9648: "Mystery", 10749: "Romance", 878: "Science Fiction",
  10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western"
};

// Global variables
let currentPage = 1;
let selectedValue = 'day';
let genreChart = null;
let lineChart = null;

// DOM elements
const container = document.querySelector('.movie-container');
const currentPageText = document.getElementById('current');
const prevButton = document.getElementById('prev');
const nextButton = document.getElementById('next');
const select = document.getElementById('time');
const trailerModal = document.getElementById('trailer-modal');
const trailerContainer = document.getElementById('trailer-container');
const trailerClose = document.getElementById('close-trailer-modal');
const toastElement = document.getElementById('toast');

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await initializeApp();
    setupEventListeners();
  } catch (error) {
    console.error('Initialization error:', error);
  }
});

async function initializeApp() {
  await fetchAndDisplayMovies(currentPage);
  await generateGenreChart();
  await createLineChart();
  await fetchUpcomingMovies();
}

function setupEventListeners() {
  // Pagination and filtering
  select.addEventListener('change', handleTimeWindowChange);
  prevButton.addEventListener('click', handlePrevPage);
  nextButton.addEventListener('click', handleNextPage);
  
  // Trailer modal
  trailerClose.addEventListener('click', closeTrailerModal);
  window.addEventListener('click', (e) => {
    if (e.target === trailerModal) closeTrailerModal();
  });
  
  // Sidebar highlight
  document.querySelectorAll('.left-menu').forEach(menuItem => {
    const link = menuItem.querySelector('a');
    if (link && window.location.href.includes(link.getAttribute('href'))) {
      menuItem.classList.add('active');
    }
  });
}

// Movie display functions
async function fetchAndDisplayMovies(page = 1) {
  try {
    const url = `${BASE_URL}/trending/movie/${selectedValue}?api_key=${API_KEY}&language=en-US&page=${page}`;
    const response = await fetch(url);
    const data = await response.json();
    
    container.innerHTML = '';
    displayTopMovies(data.results);
    currentPageText.textContent = page;
  } catch (error) {
    console.error('Error fetching movies:', error);
    showToast('Failed to load movies. Please try again.');
  }
}

function displayTopMovies(movies) {
  movies.forEach((movie, index) => {
    const globalIndex = (currentPage - 1) * 20 + (index + 1);
    const genreNames = movie.genre_ids.map(id => GENRE_MAP[id]).filter(Boolean).join(' | ');
    const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';

    const movieHTML = `
      <div class="movie-list-container" movie-id="${movie.id}">
        <div class="movie-rank">${globalIndex}</div>
        <div class="movie-list-img">
          <img src="${movie.poster_path ? IMAGE_URL + movie.poster_path : 'placeholder.jpg'}" alt="${movie.title}">
        </div>
        <div class="movie-list-content">
          <div class="movie-list-title">
            <h4>${movie.title}</h4>
            <div style="display: flex; align-items: center; gap: 10px;">
              <i class="fas fa-bookmark bookmark-icon"></i>
              <div class="vote">${movie.vote_average?.toFixed(1) || 'N/A'}</div>
            </div>
          </div>
          <div class="movie-details">
            <p>${year} |</p>
            <p>&nbsp;${genreNames}</p>
          </div>
          <div class="movie-list-overview">
            <p>${movie.overview || 'No overview available'}</p>  
            <button class="movie-trailer" data-id="${movie.id}">
              <i class="fas fa-solid fa-play"></i> Trailer
            </button>
          </div>
        </div>
      </div>
    `;

    container.insertAdjacentHTML('beforeend', movieHTML);
  });

  // Add event listeners to new elements
  document.querySelectorAll('.movie-trailer').forEach(btn => {
    btn.addEventListener('click', () => showTrailerModal(btn.dataset.id));
  });
  
  attachWatchlistListeners();
}

// Chart functions
async function generateGenreChart() {
  try {
    const movies = await fetchAllTrendingMovies(selectedValue);
    const genreCounts = calculateGenreCounts(movies);
    const { labels, percentages } = processGenreData(genreCounts);

    const ctx = document.getElementById('genreChart')?.getContext('2d');
    if (!ctx) return;

    if (genreChart) genreChart.destroy();

    genreChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Percentage (%)',
          data: percentages,
          backgroundColor: generateChartColors(labels.length),
          borderRadius: 8
        }]
      },
      options: getChartOptions('Trending Movie Genre Distribution (%)', 'Genres', 'Percentage')
    });
  } catch (error) {
    console.error('Error generating genre chart:', error);
  }
}

async function createLineChart() {
  try {
    const moviesData = await fetchTop5Movies();
    if (moviesData.length === 0) return;

    const ctx = document.getElementById('top5LineChart')?.getContext('2d');
    if (!ctx) return;

    if (lineChart) lineChart.destroy();

    lineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: moviesData.map(movie => movie.title),
        datasets: [{
          label: 'Movie Popularity',
          data: moviesData.map(movie => movie.popularity),
          borderColor: '#ff6347',
          backgroundColor: 'rgba(255, 99, 132, 0.4)',
          borderWidth: 3,
          pointBackgroundColor: '#ff6347',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6,
          fill: true,
        }]
      },
      options: getLineChartOptions()
    });
  } catch (error) {
    console.error('Error creating line chart:', error);
  }
}

// Helper functions for charts
function calculateGenreCounts(movies) {
  const counts = {};
  Object.values(GENRE_MAP).forEach(name => (counts[name] = 0));
  
  movies.forEach(movie => {
    movie.genre_ids?.forEach(id => {
      const name = GENRE_MAP[id];
      if (name) counts[name]++;
    });
  });
  
  return counts;
}

function processGenreData(genreCounts) {
  const sorted = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
    
  const total = sorted.reduce((sum, [, count]) => sum + count, 0);
  return {
    labels: sorted.map(([name]) => name),
    percentages: sorted.map(([, count]) => ((count / total) * 100).toFixed(2))
  };
}

function generateChartColors(count) {
  return Array.from({ length: count }, (_, i) => 
    `hsl(${(i * 360) / count}, 70%, 60%)`);
}

function getChartOptions(title, xTitle, yTitle) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: title,
        color: '#fff',
        font: { size: 16 }
      }
    },
    scales: {
      x: {
        ticks: { color: '#fff' },
        title: {
          display: true,
          text: xTitle,
          color: '#fff',
          font: { size: 14 }
        }
      },
      y: {
        ticks: {
          callback: val => `${val}%`,
          color: '#fff'
        },
        title: {
          display: true,
          text: yTitle,
          color: '#fff',
          font: { size: 14 }
        }
      }
    }
  };
}

function getLineChartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: '#fff' },
        grid: { color: 'rgba(255,255,255,0.1)' },
        title: {
          display: true,
          text: 'Popularity',
          color: '#fff',
          font: { size: 14 }
        }
      },
      x: {
        ticks: { color: '#fff' },
        grid: { color: 'rgba(255,255,255,0.1)' },
        title: {
          display: true,
          text: 'Movies',
          color: '#fff',
          font: { size: 14 }
        }
      }
    },
    plugins: {
      title: {
        display: true,
        text: 'Top 5 Popular Movies',
        color: '#fff',
        font: { size: 16 }
      },
      legend: {
        labels: { color: '#fff' }
      }
    }
  };
}

// API fetch functions
async function fetchAllTrendingMovies(timeWindow) {
  let allMovies = [];
  for (let page = 1; page <= 5; page++) {
    const res = await fetch(`${BASE_URL}/trending/movie/${timeWindow}?api_key=${API_KEY}&page=${page}`);
    const data = await res.json();
    allMovies = allMovies.concat(data.results);
  }
  return allMovies;
}

async function fetchTop5Movies() {
  const res = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&page=1`);
  const data = await res.json();
  return data.results.slice(0, 5).map(movie => ({
    title: movie.title,
    popularity: movie.popularity,
    posterUrl: movie.poster_path ? `${IMAGE_URL}${movie.poster_path}` : null
  }));
}

async function fetchUpcomingMovies() {
  try {
    const res = await fetch(`${BASE_URL}/movie/upcoming?api_key=${API_KEY}&page=1`);
    const data = await res.json();
    const movies = data.results
      .filter(movie => new Date(movie.release_date) > new Date())
      .slice(0, 5);
      
    const moviesList = document.getElementById('movies-list');
    moviesList.innerHTML = movies.map((movie, index) => `
      <li class="table-row">
        <div class="number">${index + 1}</div>
        <div class="movie-name">${movie.title}</div>
        <div class="movie-genre">${getFirstGenre(movie.genre_ids)}</div>
        <div class="movie-release-date">${movie.release_date}</div>
      </li>
    `).join('');
  } catch (error) {
    console.error('Error fetching upcoming movies:', error);
  }
}

function getFirstGenre(genreIds) {
  return genreIds?.length ? GENRE_MAP[genreIds[0]] || 'Unknown' : 'Unknown';
}

// Watchlist functions
async function attachWatchlistListeners() {
  document.querySelectorAll('.movie-list-container').forEach(async item => {
    const movieId = item.getAttribute('movie-id');
    const icon = item.querySelector('.bookmark-icon');
    const image = item.querySelector('.movie-list-img');
    const title = item.querySelector('.movie-list-title');

    try {
      const res = await fetch(`/watchlist/check/${movieId}`);
      const data = await res.json();
      if (data.inWatchlist) {
        icon.classList.add('active');
      }
    } catch (err) {
      console.error('Error checking watchlist:', err);
    }

    // Attach listeners
    icon.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleWatchlist(icon, movieId);
    });

    [image, title].forEach(el => {
      el.addEventListener('click', () => watchMovie(movieId));
    });
  });
}

async function toggleWatchlist(icon, movieId) {
  const isAdding = !icon.classList.contains('active');

  try {
    if (isAdding) {
      const movie = await fetchMovieDetails(movieId);
      const movieData = {
        id: movieId,
        title: movie.title,
        year: movie.release_date?.split('-')[0] || 'N/A',
        description: movie.overview || '',
        img: movie.poster_path ? `${IMAGE_URL}${movie.poster_path}` : 'placeholder.jpg',
        rating: movie.vote_average?.toFixed(1) || 'N/A',
        watched: false
      };

      const res = await fetch('/watchlist/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(movieData)
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.message || 'Failed to add');

      icon.classList.add('active');
      showToast('Added to Watchlist');
    } else {
      const res = await fetch('/watchlist/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movieId })
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.message || 'Failed to remove');

      icon.classList.remove('active');
      showToast('Removed from Watchlist');
    }

  } catch (error) {
    console.error('Error updating watchlist:', error);
    showToast('Watchlist update failed');
  }
}

async function fetchMovieDetails(movieId) {
  const res = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}`);
  return await res.json();
}

// Trailer functions
async function showTrailerModal(movieId) {
  try {
    const res = await fetch(`${BASE_URL}/movie/${movieId}/videos?api_key=${API_KEY}`);
    const data = await res.json();
    const trailer = data.results.find(v => v.site === 'YouTube' && v.type === 'Trailer');
    
    if (trailer) {
      trailerContainer.innerHTML = `
        <iframe src="https://www.youtube.com/embed/${trailer.key}?autoplay=1"
                allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
      trailerModal.classList.add('show');
    } else {
      showToast('No trailer available');
    }
  } catch (error) {
    console.error('Error loading trailer:', error);
    showToast('Failed to load trailer');
  }
}

function closeTrailerModal() {
  trailerModal.classList.remove('show');
  trailerContainer.innerHTML = '';
}

// Pagination functions
function handleTimeWindowChange() {
  selectedValue = select.value;
  currentPage = 1;
  Promise.all([
    fetchAndDisplayMovies(currentPage),
    generateGenreChart()
  ]).catch(error => {
    console.error('Error during time window change:', error);
  });
}

function handlePrevPage() {
  if (currentPage > 1) {
    currentPage--;
    fetchAndDisplayMovies(currentPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function handleNextPage() {
  currentPage++;
  fetchAndDisplayMovies(currentPage);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Utility functions
async function watchMovie(movieId, movieTitle = null) {
    // If movieTitle isn't provided, try to get it from DOM
    if (!movieTitle) {
        const titleEl = document.querySelector(
            `.movie-list-item[data-id="${movieId}"] .movie-list-item-title`
        );
        movieTitle = titleEl ? titleEl.textContent.trim() : '';
    }

    try {
        // Send request to add to watch history
        const response = await fetch('/watchHistory/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ movieId: movieId, title: movieTitle }),
        });

        const data = await response.json();

        if (data.message === 'Movie added to watch history') {
            // Redirect after successful save
            window.location.href = `/movie/${movieId}`;
        } else {
            alert('Error adding movie to history');
        }
    } catch (error) {
        console.error('Error adding to watch history:', error);
        alert('Error adding to history');
    }
}


function showToast(message) {
  toastElement.textContent = message;
  toastElement.classList.add('show');
  setTimeout(() => toastElement.classList.remove('show'), 2000);
}