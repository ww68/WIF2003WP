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

document.querySelector(".btn-secondary").addEventListener("click", () => {
    if (confirm("Are you sure you want to discard your changes?")) {
        window.history.back();
    }
});


const saveBtn = document.querySelector(".btn-primary");
document.querySelector("form").addEventListener("submit", (e) => {
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";

    // setTimeout(() => {
    //     alert("Your profile has been updated successfully!");
    //     window.location.href = "profile";
    // }, 1000); // simulate 1s delay
});