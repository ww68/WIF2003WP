const API_KEY = '9a56291f8d522c5f874ed7812f062758';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/w500';

const historyContainer = document.getElementById("historyContainer");

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
    const response = await fetch(`/watchHistory/getHistory`);
    const history = await response.json();

    if (history.length === 0) {
        const noHistoryMessage = document.createElement('p');
        noHistoryMessage.textContent = "No watch history available.";
        historyContainer.appendChild(noHistoryMessage);
        return;
    }

    // Fetch movie details and create movie cards
    let lastId = null;
    for (const entry of history) {
        const movieId = entry.movieId;

        if (movieId === lastId) continue;  // skip consecutive duplicates
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
        // Send selected genres to the backend to save
        fetch('/profile/updateGenres', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ selectedGenres })
        })
        .then(response => response.json())
        .then(data => {
            alert('Preferences saved!');
        })
        .catch(error => {
            console.error('Error saving genre preferences:', error);
        });
    }
});

// Function to toggle password visibility
function togglePasswordVisibility(inputId, iconId) {
    const passwordInput = document.getElementById(inputId);
    const icon = document.getElementById(iconId);

    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        icon.classList.remove("bi-eye-slash");
        icon.classList.add("bi-eye");
    } else {
        passwordInput.type = "password";
        icon.classList.remove("bi-eye");
        icon.classList.add("bi-eye-slash");
    }
}

document.getElementById("toggleNewPassword").addEventListener("click", function() {
    togglePasswordVisibility("newPassword", "toggleNewPassword");
});

document.getElementById("toggleConfirmPassword").addEventListener("click", function() {
    togglePasswordVisibility("confirmNewPassword", "toggleConfirmPassword");
});

document.getElementById("submitNewPassword").addEventListener("click", function() {
    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmNewPassword = document.getElementById("confirmNewPassword").value;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
        alert("Please fill in all fields.");
        return;
    }

    if (newPassword !== confirmNewPassword) {
        alert("New password and confirmation do not match.");
        return;
    }

    fetch('/profile/changePassword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword })
    })
    .then(res => res.json())
    .then(data => {
        if (data.message === "Password updated successfully") {
            alert(data.message);
            // Reset fields and close modal if using one
        } else {
            alert(data.message);
        }
    })
    .catch(err => {
        console.error("Error:", err);
        alert("Server error occurred");
    });
});