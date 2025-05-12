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
      <div class="movie-list-container" movie-id="${id}">
        <div class="movie-list-img">
          <img src="${IMAGE_URL}${poster_path}" alt="${title}">
        </div>
        <div class="movie-list-content">
          <div class="movie-list-title">
            <h4>${title}</h4>
            <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-bookmark bookmark-icon"></i>
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
  attachWatchlistListeners(container);

}

// Highlight saved watchlist icons
function attachWatchlistListeners(container) {
    const items = container.querySelectorAll('.movie-list-container');
    const watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];

    items.forEach(item => {
        const movieId = item.getAttribute('movie-id');
        const icon = item.querySelector('.bookmark-icon');
        const image = item.querySelector('.movie-list-img');
        const title = item.querySelector('.movie-list-title');

        if (watchlist.find(m => String(m.id) === String(movieId))) {
            icon.classList.add('active');
        }else{
          icon.classList.remove('active')
        }
        console.log('Current Watchlist:', watchlist);        

        icon.addEventListener('click', (e) => {
            e.stopPropagation(); 
            toggleWatchlist(icon, movieId)});
            
        [image, title].forEach(element => {
            element.addEventListener('click', () => watchMovie(movieId));
        });
    });
    

        
    
}

// Watchlist toggle
async function toggleWatchlist(iconElement, movieId) {
    let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
    movieId = String(movieId);
    const index = watchlist.findIndex(movie => String(movie.id) === movieId);

    if (index === -1) {
        // Add to watchlist
        try {
            const response = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=en-US`);
            const data = await response.json();

            const movieData = {
                id: String(data.id),
                title: data.title,
                year: data.release_date ? parseInt(data.release_date.split('-')[0]) : 'Unknown',
                description: data.overview || '',
                img: data.poster_path ? `${IMAGE_URL}${data.poster_path}` : 'movie-website-master/img/placeholder.jpg',
                rating: data.vote_average?.toFixed(1) || 'N/A',
                watched: false
            };

            watchlist.push(movieData);
            iconElement.classList.add('active');
            showToast('Added to Watchlist');
        } catch (error) {
            console.error('Error fetching movie details:', error);
            showToast('Failed to add movie. Try again.');
            return;
        }
    } else {
        // Remove from watchlist
        watchlist.splice(index, 1);
        iconElement.classList.remove('active');
        showToast('Removed from Watchlist');
    }

    // Always update after push/splice
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
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

// Event delegation to handle dynamically created bookmark icons
/*container.addEventListener('click', (e) => {
  if (e.target.classList.contains('bookmark-icon')) {
    const isBookmarked = e.target.classList.contains('fas');
    
    e.target.classList.toggle('bookmarked');
    if (isBookmarked) {
      showToast('Removed from bookmarks');
    } else {
      showToast('Added to bookmarks');
    }
  }
});
*/


function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2000);
}

function watchMovie(movieId) {
    // Save to watch history
    let history = JSON.parse(localStorage.getItem('watchHistory')) || [];
    const entry = {
      id: String(movieId),
      timestamp: new Date().toISOString()
    };
    history.unshift(entry); // add to front (latest first)
    localStorage.setItem('watchHistory', JSON.stringify(history));

    // Redirect to movie detail page
    window.location.href = `movie.html?id=${movieId}`;
}