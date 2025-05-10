const API_KEY = '9a56291f8d522c5f874ed7812f062758';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/w500';
const historyContainer = document.getElementById('history-container');
const emptyState = document.getElementById('empty-state');

const historyIds = JSON.parse(localStorage.getItem('watchHistory')) || [];

async function getMovieDetails(movieId) {
  const response = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}`);
  return response.json();
}

function createMovieCard(movie) {
  const col = document.createElement('div');
  col.className = 'col-md-3 col-sm-6 mb-4';

  col.innerHTML = `
    <div class="card h-100 shadow-sm border-0">
      <img src="${IMAGE_URL + movie.poster_path}" class="card-img-top" alt="${movie.title}">
      <div class="card-body">
        <h6 class="card-title text-truncate" title="${movie.title}">${movie.title}</h6>
        <p class="text-muted small mb-0"> ${movie.release_date.split('-')[0]}</p>
        <p class="text-muted small mb-0"> ${movie.genres.map(g => g.name).join(', ')}</p>
      </div>
    </div>
  `;

  return col;
}

async function loadHistory() {
    const history = JSON.parse(localStorage.getItem('watchHistory')) || [];

    if (history.length === 0) {
        emptyState.classList.remove('d-none');
        return;
    }

    const grouped = {};
    let lastId = null;

    for (const entry of history) {
        if (entry.id === lastId) continue; // skip consecutive duplicate
        lastId = entry.id;

        const label = getDateLabel(entry.timestamp);
        if (!grouped[label]) grouped[label] = [];
        grouped[label].push(entry.id);
    }

    for (const label of Object.keys(grouped)) {
        const section = document.createElement('div');
        section.classList.add('mb-4');
        section.innerHTML = `<h5 class="text-white mb-3">${label}</h5><div class="row" id="group-${label}"></div>`;
        historyContainer.appendChild(section);

        for (const id of grouped[label]) {
            try {
                const movie = await getMovieDetails(id);
                const card = createMovieCard(movie);
                section.querySelector(`#group-${label}`).appendChild(card);
            } catch (err) {
                console.error(`Failed to fetch movie ${id}`, err);
            }
        }
    }
}


loadHistory();

function saveToHistory(movieId) {
    let history = JSON.parse(localStorage.getItem('watchHistory')) || [];
    const entry = {
        id: movieId,
        timestamp: new Date().toISOString()
    };
    history.unshift(entry); // Add to front
    localStorage.setItem('watchHistory', JSON.stringify(history));
}

  
function getDateLabel(dateStr) {
    const watchDate = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isSameDay = (d1, d2) =>
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear();

    if (isSameDay(watchDate, today)) return 'Today';
    if (isSameDay(watchDate, yesterday)) return 'Yesterday';

    const diffTime = today - watchDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 7) {
    return watchDate.toLocaleDateString('en-US', { weekday: 'long' });
    }

    return watchDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }); // e.g., "2 May"
}
  


  
