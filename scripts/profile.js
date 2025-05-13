const API_KEY = '9a56291f8d522c5f874ed7812f062758';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/w500';

const historyContainer = document.getElementById("historyContainer");
const historyIds = JSON.parse(localStorage.getItem('watchHistory')) || [];

async function getMovieDetails(movieId) {
    const response = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}`);
    return response.json();
  }

function createMovieCard(movie) {
    const div = document.createElement("div");
    div.style.minWidth = "180px";
    div.style.scrollSnapAlign = "start";
  
    div.innerHTML = `
        <img src="${IMAGE_URL}${movie.backdrop_path || movie.poster_path}" 
             alt="${movie.title}" 
             class="img-fluid rounded mb-2" 
             style="height: 100px; width: 100%; object-fit: cover;">
        <p class="mb-0 fw-semibold small">${movie.title}</p>
        <small class="text-muted">${movie.release_date.split('-')[0]} | ${movie.genres.slice(0, 2).map(g => g.name).join(', ')}</small>

    `;
  
    return div;
}

async function loadHistory() {
    if (historyIds.length === 0) {
        const noHistoryMessage = document.createElement('p');
        noHistoryMessage.textContent = "No watch history available.";
        historyContainer.appendChild(noHistoryMessage);
        return;
    }

    let lastId = null;

    for (const entry of historyIds) {
        const movieId = entry.id;

        if (movieId === lastId) continue; // skip consecutive duplicate
        lastId = movieId;

        try {
            const movie = await getMovieDetails(movieId);
            const movieCard = createMovieCard(movie);
            historyContainer.appendChild(movieCard);
        } catch (err) {
            console.error(`Failed to fetch movie ${movieId}:`, err);
        }
    }
}

loadHistory();

document.addEventListener("DOMContentLoaded", () => {
    const savedGenres = JSON.parse(localStorage.getItem("genrePreferences")) || [];

    savedGenres.forEach(genre => {
        const checkbox = document.querySelector(`input[value="${genre}"]`);
        if (checkbox) checkbox.checked = true;
    });
});

document.getElementById("genreForm").addEventListener("submit", function(e) {
    e.preventDefault();
    
    const selectedGenres = Array.from(document.querySelectorAll('#genreForm input[type="checkbox"]:checked'))
    .map(input => input.value);

    const userConfirmed = confirm("Are you sure you want to save your genre preferences?");
        if (userConfirmed) {
            localStorage.setItem("genrePreferences", JSON.stringify(selectedGenres));
            alert("Preferences saved!");
        }
});
