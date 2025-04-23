const API_KEY = '9a56291f8d522c5f874ed7812f062758';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/w200';
let currentPage = 1;
let selectedValue = 'day';

const container = document.querySelector('.movie-container');
const currentPageText = document.getElementById('current');
const prevButton = document.getElementById('prev');
const nextButton = document.getElementById('next');
const select = document.getElementById('time');

select.addEventListener('change', () => {
  selectedValue = select.value;
  currentPage = 1;
  fetchAndDisplayMovies(currentPage);
});

function getTopRatedUrl(page) {
  return `${BASE_URL}/trending/movie/${selectedValue}?api_key=${API_KEY}&language=en-US&page=${page}`;
}

function fetchAndDisplayMovies(page = 1) {
  fetch(getTopRatedUrl(page))
    .then(res => res.json())
    .then(data => {
      console.log(data);
      const movies = data.results;
      container.innerHTML = ''; // Clear old content
      displayTopMovies(movies);
      currentPageText.textContent = page;
    })
    .catch(err => console.error('Error fetching top rated movies:', err));
}

function displayTopMovies(movies) {
  movies.forEach(movie => {
    const { id, title, vote_average, release_date, overview, poster_path, genre_ids } = movie;
    const year = new Date(release_date).getFullYear() + '-' + new Date(release_date).getMonth() + '-' + new Date(release_date).getDate();
    const genreNames = genre_ids.map(id => GENRE_MAP[id]).filter(Boolean).join(' | ');

    const movieHTML = `
      <div class="movie-list-container">
        <div class="movie-list-img">
          <img src="${IMAGE_URL}${poster_path}" alt="${title}">
        </div>
        <div class="movie-list-content">
          <div class="movie-list-title">
            <h4>${title}</h4>
            <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-regular fa-heart"></i>
            <div class="vote">${vote_average.toFixed(1)}</div>
            </div>
          </div>
          <div class="movie-details">
            <p>${year} |</p>
            <p>&nbsp;${genreNames}</p>
          </div>
          <div class="movie-list-overview">
            <p>${overview}</p>  
            <button class="movie-trailer" data-id="${id}"><i class="fas fa-solid fa-play"></i> Trailer</button>
          </div>
        </div>
      </div>
    `;

    container.insertAdjacentHTML('beforeend', movieHTML);
  });

  // Add trailer event listeners after rendering
  document.querySelectorAll('.movie-trailer').forEach(button => {
    button.addEventListener('click', () => {
      const movieId = button.getAttribute('data-id');
      showTrailerModal(movieId);
    });
  });
  
//add to watchlist toggle heart
document.querySelectorAll('.fa-heart').forEach(heart => {
  heart.addEventListener('click', () => {
    heart.style.color = heart.style.color === 'white' ? 'red' : 'white'; // Toggle color
  });
});
}



// Trailer Modal Functions
const trailerModal = document.getElementById('trailer-modal');
const trailerContainer = document.getElementById('trailer-container');
const trailerClose = document.getElementById('close-trailer-modal');

function showTrailerModal(movieId) {
  fetch(`${BASE_URL}/movie/${movieId}/videos?api_key=${API_KEY}`)
    .then(response => response.json())
    .then(data => {
      const trailer = data.results.find(v => v.site === 'YouTube' && v.type === 'Trailer');
      if (trailer) {
        trailerContainer.innerHTML = `
          <iframe 
            src="https://www.youtube.com/embed/${trailer.key}?autoplay=1"
            allow="autoplay; encrypted-media" 
            allowfullscreen>
          </iframe>`;
        trailerModal.classList.add('show');
      } else {
        alert('No trailer available!');
      }
    })
    .catch(err => console.error('Error loading trailer:', err));
}

trailerClose.addEventListener('click', () => {
  trailerModal.classList.remove('show');
  trailerContainer.innerHTML = '';
});

window.addEventListener('click', (e) => {
  if (e.target === trailerModal) {
    trailerModal.classList.remove('show');
    trailerContainer.innerHTML = '';
  }
});

// Pagination
prevButton.addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    fetchAndDisplayMovies(currentPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

nextButton.addEventListener('click', () => {
  currentPage++;
  fetchAndDisplayMovies(currentPage);
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

fetchAndDisplayMovies(currentPage);

// Sidebar highlight
document.querySelectorAll('.left-menu').forEach(menuItem => {
  const link = menuItem.querySelector('a');
  if (link && window.location.href.includes(link.getAttribute('href'))) {
    menuItem.classList.add('active');
  }
});

// Chart Modal
const modal = document.getElementById('chartModal');
const showChartBtn = document.getElementById('showChartBtn');
const closeBtn = document.querySelector('.closeBtn');
let genreChart;

const GENRE_MAP = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy",
  80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family",
  14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music",
  9648: "Mystery", 10749: "Romance", 878: "Science Fiction",
  10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western"
};

showChartBtn.addEventListener('click', () => {
  modal.classList.add('show');
  generateGenreChart();
});

closeBtn.addEventListener('click', () => {
  modal.classList.remove('show');
});

window.addEventListener('click', (event) => {
  if (event.target === modal) {
    modal.classList.remove('show');
  }
});

async function fetchAllTrendingMovies(time) {
  let page = 1;
  let allMovies = [];

  while (page <= 30) {
    const res = await fetch(`${BASE_URL}/trending/movie/${time}?api_key=${API_KEY}&language=en-US&page=${page}`);
    const data = await res.json();
    allMovies = allMovies.concat(data.results);
    page++;
  }
  return allMovies;
}

async function generateGenreChart() {
  const timeWindow = select.value || 'day';
  const movies = await fetchAllTrendingMovies(timeWindow);

  const genreCounts = {};
  Object.values(GENRE_MAP).forEach(name => {
    genreCounts[name] = 0;
  });

  movies.forEach(movie => {
    movie.genre_ids.forEach(id => {
      const name = GENRE_MAP[id];
      if (name) {
        genreCounts[name]++;
      }
    });
  });

  const totalGenres = Object.values(genreCounts).reduce((sum, count) => sum + count, 0);

  const labels = Object.keys(genreCounts);
  const values = Object.values(genreCounts);
  const percentages = values.map(v => ((v / totalGenres) * 100).toFixed(2));

  if (genreChart) genreChart.destroy();

  const ctx = document.getElementById('genreChart').getContext('2d');
  const backgroundColors = labels.map((_, i) => `hsl(${(i * 360) / labels.length}, 40%, 60%)`);

  genreChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Percentage (%)',
        data: percentages,
        backgroundColor: backgroundColors,
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      indexAxis: 'y',
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (context) => `${context.parsed.x}%`
          }
        },
        title: {
          display: true,
          text: 'Trending Movie Genre Distribution (%)',
          color: '#FFFFFF',
          font: {
            size: 20
          }
        }
      },
      scales: {
        x: {
          ticks: {
            callback: (val) => `${val}%`,
            color: '#FFFFFF'
          },
          title: {
            display: true,
            text: 'Percentage',
            color: '#FFFFFF',
            font: {
              size: 16
            }
          }
        },
        y: {
          ticks: {
            color: '#FFFFFF'
          },
          title: {
            display: true,
            text: 'Genres',
            color: '#FFFFFF',
            font: {
              size: 16
            }
          }
        }
      }
    }
  });
}



