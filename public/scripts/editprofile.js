function previewImage(event) {
    const reader = new FileReader();
    reader.onload = function () {
        const img = document.getElementById("profileImage");
        img.src = reader.result;
    };
    reader.readAsDataURL(event.target.files[0]);
    document.getElementById("fileName").textContent = event.target.files[0].name;
}

const apiHeaders = {
    'X-RapidAPI-Key': '65d9fa9e11mshc132ce6df0e8e55p1379c7jsn43a51b59acef',
    'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com'
};

let selectedCountryCode = '';

const countryInput = document.getElementById('country');
const countrySuggestions = document.getElementById('countrySuggestions');

const cityInput = document.getElementById('city');
const citySuggestions = document.getElementById('citySuggestions');

countryInput.addEventListener('input', debounce(() => {
    const query = countryInput.value;
    selectedCountryCode = '';
    cityInput.disabled = true;
    cityInput.value = '';
    citySuggestions.innerHTML = '';
    if (query.length < 2) {
        countrySuggestions.innerHTML = '';
        return;
    }

    fetch(`https://wft-geo-db.p.rapidapi.com/v1/geo/countries?limit=10&namePrefix=${query}`, {
        method: 'GET',
        headers: apiHeaders
    })
    .then(response => response.json())
    .then(data => {
        countrySuggestions.innerHTML = '';
        data.data.forEach(country => {
            const item = document.createElement('li');
            item.className = 'list-group-item list-group-item-action';
            item.textContent = `${country.name} (${country.code})`;
            item.addEventListener('click', () => {
                countryInput.value = country.name;
                selectedCountryCode = country.code;
                countrySuggestions.innerHTML = '';
                cityInput.disabled = false;
                cityInput.focus();
            });
            countrySuggestions.appendChild(item);
        });
    })
    .catch(err => console.error(err));
}, 500));

cityInput.addEventListener('input', debounce(() => {
    const query = cityInput.value;
    if (query.length < 2 || !selectedCountryCode) {
        citySuggestions.innerHTML = '';
        return;
    }

    fetch(`https://wft-geo-db.p.rapidapi.com/v1/geo/cities?limit=5&namePrefix=${query}&countryIds=${selectedCountryCode}`, {
        method: 'GET',
        headers: apiHeaders
    })
    .then(response => response.json())
    .then(data => {
        citySuggestions.innerHTML = '';
        if (!data || !data.data) return;

        const seenRegions = new Set();

        data.data.forEach(city => {
            if (!seenRegions.has(city.region)) {
                seenRegions.add(city.region);

                const listItem = document.createElement('li');
                listItem.classList.add('list-group-item');
                listItem.textContent = city.region;

                listItem.addEventListener('click', () => {
                    cityInput.value = city.region; // only set the region
                    citySuggestions.innerHTML = '';
                });

                citySuggestions.appendChild(listItem);
            }
        });
    })
    .catch(error => {
        console.error('Error fetching cities:', error);
    });
}, 500));

function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

document.querySelector(".btn-secondary").addEventListener("click", async () => {
     if (!hasFormChanged()) {
        window.history.back();
        return;
    }

    const discardConfirmed = await showConfirmationModal({
        title: 'Discard Changes?',
        message: 'Are you sure you want to discard your changes?',
        subMessage: 'Your unsaved edits will be lost.',
        confirmText: 'Discard',
        cancelText: 'Cancel',
        confirmIcon: 'fas fa-times',
        warningIcon: 'fas fa-exclamation-triangle',
        confirmButtonClass: 'btn-danger',
        showWarningIcon: true
    });

    if (discardConfirmed) {
        window.history.back();
    }
});

const saveBtn = document.querySelector(".btn-primary");
const form = document.querySelector("form");
const originalFormData = new FormData(form);

function hasFormChanged() {
    const currentData = new FormData(form);

    for (const [key, value] of currentData.entries()) {
        const originalValue = originalFormData.get(key);

        if (value instanceof File) {
            if (value.name !== originalValue?.name || value.size !== originalValue?.size) {
                return true;
            }
        } else if (originalValue !== value) {
            return true;
        }
    }

    return false; // No changes
}



form.addEventListener("submit", async (e) => {
    e.preventDefault(); // Prevent direct submit

    if (!hasFormChanged()) {
        await showSuccessModal({
            title: 'No Changes Made',
            message: 'You haven’t changed anything in your profile.',
            confirmText: 'OK'
        });

        return;
    }

    const confirmed = await showConfirmationModal({
        title: 'Save Changes?',
        message: 'Are you sure you want to update your profile?',
        subMessage: 'You can always edit it again later.',
        confirmText: 'Save',
        cancelText: 'Cancel',
        confirmIcon: 'fas fa-save',
        warningIcon: 'fas fa-user-edit',
        confirmButtonClass: 'btn-primary',
        showWarningIcon: true
    });

    if (confirmed) {
        saveBtn.disabled = true;
        saveBtn.textContent = "Saving...";

        // Simulate save delay (or send AJAX if needed)
        setTimeout(async () => {
            await showSuccessModal({
            message: "Your profile has been updated successfully!"
        });
            form.submit(); // Real form submit after modal confirmation
        }, 500);
    }
});

function showConfirmationModal(options = {}) {
    const {
        title = 'Confirm Action',
        message = 'Are you sure?',
        subMessage = '',
        confirmText = 'Confirm',
        cancelText = 'Cancel',
        confirmIcon = 'fas fa-check',
        warningIcon = 'fas fa-exclamation-triangle',
        confirmButtonClass = 'btn-primary',
        showWarningIcon = true
    } = options;

    return new Promise((resolve) => {
        const modalHTML = `
            <div class="delete-modal-backdrop" onclick="resolveConfirmation(false)">
                <div class="delete-modal-content" onclick="event.stopPropagation()">
                    ${showWarningIcon ? `
                        <div class="delete-icon">
                            <i class="${warningIcon}"></i>
                        </div>` : ''}
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
                            </button>` : ''}
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

function showSuccessModal(options = {}) {
    return showConfirmationModal({
        title: options.title || 'Success!',
        message: options.message || 'Action completed successfully.',
        confirmText: options.confirmText || 'OK',
        cancelText: '',
        confirmIcon: options.confirmIcon || 'fas fa-check',
        warningIcon: options.warningIcon || 'fas fa-check-circle',
        confirmButtonClass: options.confirmButtonClass || 'btn-success',
        showWarningIcon: options.showWarningIcon !== false
    });
}

