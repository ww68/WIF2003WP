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
    const response = await fetch(`/profile/getHistory`);
    const history = await response.json();

    if (history.length === 0) {
        const noHistoryMessage = document.createElement('p');
        noHistoryMessage.textContent = "No watch history available.";
        historyContainer.appendChild(noHistoryMessage);
        return;
    }

    // Fetch movie details and create movie cards
    let lastId = null;
    for (const entry of history.slice().reverse()) {
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

document.getElementById("genreForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const selectedGenres = Array.from(document.querySelectorAll('#genreForm input[type="checkbox"]:checked'))
        .map(input => input.value);

    const confirmed = await showPreferencesConfirmation();

    if (confirmed) {
        try {
            const response = await fetch('/profile/updateGenres', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ selectedGenres })
            });

            const data = await response.json();
            if (data.message === "Preferences saved successfully") {
                await showSuccessModal('Your genre preferences have been updated!');
                location.reload(); // Only reload after user acknowledges
            } else {
                alert('Error saving genre preferences');
            }
        } catch (error) {
            console.error('Error saving genre preferences:', error);
        }
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
    .then(async data => {
        if (data.message === "Password updated successfully") {
            await showSuccessModal('Password updated successfully!');
            // Reset fields and close modal
            document.getElementById("currentPassword").value = '';
            document.getElementById("newPassword").value = '';
            document.getElementById("confirmNewPassword").value = '';
            const modal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'));
            modal.hide();
        } else {
            alert(data.message);
        }
    })
    .catch(err => {
        console.error("Error:", err);
        alert("Server error occurred");
    });
});

document.getElementById('delete-account').addEventListener('click', async () => {
    const confirmed = await showConfirmationModal();
    
    if (confirmed) {
        try {
            const response = await fetch('/profile/deleteAccount', { method: 'POST' });
            const data = await response.text();

            await showSuccessModal('Your account has been deleted successfully!');
            // Redirect user manually to login
            window.location.href = '/';
        } catch (error) {
            console.error('Error deleting account:', error);
            alert("Error deleting account. Please try again.");
        }
    }
});

// Generic reusable modal function
function showConfirmationModal(options = {}) {
    const {
        title = 'Delete Account Permanently?',
        message = 'Are you sure you want to delete your account?',
        subMessage = 'This action cannot be undone.',
        confirmText = 'Confirm',
        cancelText = 'Cancel',
        confirmIcon = 'fas fa-check',
        warningIcon = 'fas fa-exclamation-triangle',
        confirmButtonClass = 'btn-danger',
        showWarningIcon = true
    } = options;

    return new Promise((resolve) => {
        const modalHTML = `
            <div class="delete-modal-backdrop" onclick="resolveConfirmation(false)">
                <div class="delete-modal-content" onclick="event.stopPropagation()">
                    ${showWarningIcon ? `
                        <div class="delete-icon">
                            <i class="${warningIcon}"></i>
                        </div>
                    ` : ''}
                    <h3>${title}</h3>
                    <p>${message}</p>
                    ${subMessage ? `<p><small>${subMessage}</small></p>` : ''}
                    <div class="modal-buttons">
                        <button class="${confirmButtonClass}" onclick="resolveConfirmation(true)">
                            <i class="${confirmIcon}"></i> ${confirmText}
                        </button>
                        ${cancelText ? `
                            <button class="btn-secondary" onclick="resolveConfirmation(false)">
                                ${cancelText}
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        
        const modal = document.createElement('div');
        modal.innerHTML = modalHTML;
        document.body.appendChild(modal);
        
        window.resolveConfirmation = (confirmed) => {
            document.body.removeChild(modal);
            delete window.resolveConfirmation;
            resolve(confirmed);
        };
    });
}

document.getElementById('logout-button').addEventListener('click', async (e) => {
    e.preventDefault(); // Prevent direct navigation

    const confirmed = await showLogoutConfirmation();

    if (confirmed) {
        window.location.href = '/profile/logout';
    }
});

function showLogoutConfirmation() {
    return showConfirmationModal({
        title: 'Log Out?',
        message: 'Are you sure you want to log out?',
        subMessage: '',
        confirmText: 'Log Out',
        cancelText: 'Cancel',
        confirmIcon: 'fas fa-sign-out-alt',
        warningIcon: 'fas fa-sign-out-alt',
        confirmButtonClass: 'btn-warning',
        showWarningIcon: true
    });
}

function showPreferencesConfirmation() {
    return showConfirmationModal({
        title: 'Save Genre Preferences?',
        message: 'Are you sure you want to update your genre preferences?',
        subMessage: 'You can update this anytime later.',
        confirmText: 'Save',
        cancelText: 'Cancel',
        confirmIcon: 'fas fa-save',
        warningIcon: 'fas fa-list',
        confirmButtonClass: 'btn-primary',
        showWarningIcon: true
    });
}

function showSuccessModal(message) {
    return showConfirmationModal({
        title: 'Success!',
        message: message,
        subMessage: '',
        confirmText: 'OK',
        cancelText: '',
        confirmIcon: 'fas fa-check',
        warningIcon: 'fas fa-check-circle',
        confirmButtonClass: 'btn-success',
        showWarningIcon: true
    });
}