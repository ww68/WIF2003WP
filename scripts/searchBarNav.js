const TMDB_API_KEY = 'b5ca748da01c92488ef670a84e31c784';
const API_BASE = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w200';

document.addEventListener("DOMContentLoaded", () => {
    const searchForms = document.querySelectorAll('form[role="search"]');
  
    searchForms.forEach(form => {
      const input = form.querySelector('input[type="search"]');
      const voiceBtn = form.querySelector('.voiceBtn');

      const dropdown = document.createElement("ul");
dropdown.className = "list-group w-100 shadow";
dropdown.style.position = "absolute";
dropdown.style.top = "100%";
dropdown.style.left = "0";
dropdown.style.zIndex = 1050;
dropdown.style.display = "none";
dropdown.style.backgroundColor = "#212529"; // Dark bg
        dropdown.style.border = "1px solid #343a40"; // Darker border
        form.style.position = "relative";
        form.appendChild(dropdown);

const loadSuggestions = () => {
  dropdown.innerHTML = "";
  const recent = JSON.parse(localStorage.getItem("recentSearches") || "[]");
  if (recent.length === 0) return;

  recent.slice(0, 5).forEach(item => {
    const li = document.createElement("li");
    li.className = "list-group-item d-flex justify-content-between align-items-center bg-dark text-white border-secondary";

    const text = document.createElement("span");
    text.textContent = item;
    text.className = "flex-grow-1";
    text.style.cursor = "pointer";
    text.onclick = () => {
      input.value = item;
      form.requestSubmit();
    };

   const deleteBtn = document.createElement("button");
deleteBtn.innerHTML = `<i class="fas fa-trash-alt text-white"></i>`;
deleteBtn.className = "btn deleteBtn p-1";
deleteBtn.onmousedown = (e) => e.preventDefault(); // Prevent background on click
deleteBtn.onfocus = (e) => e.target.style.background = "transparent"; // Ensure focus doesn't change background
deleteBtn.onclick = (e) => {
  e.stopPropagation();
  let recent = JSON.parse(localStorage.getItem("recentSearches") || "[]");
  recent = recent.filter(q => q !== item);
  localStorage.setItem("recentSearches", JSON.stringify(recent));
  loadSuggestions();
};


    li.appendChild(text);
    li.appendChild(deleteBtn);
    dropdown.appendChild(li);
  });

  dropdown.style.display = "block";
};

        input.addEventListener("focus", loadSuggestions);
        input.addEventListener("input", () => {
  const query = input.value.trim();

  if (query === "") {
    loadSuggestions(); // fallback to recent searches
    return;
  }

  fetch(`${API_BASE}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=1`)
    .then(res => res.json())
    .then(data => {
      dropdown.innerHTML = "";

      data.results.slice(0, 5).forEach(movie => {
        const li = document.createElement("li");
        li.className = "list-group-item d-flex justify-content-between align-items-center bg-dark text-white";

        const text = document.createElement("span");
        text.textContent = movie.title;
        text.className = "flex-grow-1";
        text.style.cursor = "pointer";
        text.onclick = () => {
          input.value = movie.title;
          form.requestSubmit(); // triggers search
        };

        li.appendChild(text);
        dropdown.appendChild(li);
      });

      dropdown.style.display = "block";
    })
    .catch(err => {
      console.error("Error fetching movie suggestions:", err);
    });
});


        document.addEventListener("click", e => {
            if (!form.contains(e.target)) {
                dropdown.style.display = "none";
            }
        });

        form.addEventListener("submit", e => {
            e.preventDefault();
            const query = input.value.trim();
            if (!query) return;

            // Save to recent
            let recent = JSON.parse(localStorage.getItem("recentSearches") || "[]");
            recent = [query, ...recent.filter(q => q !== query)];
            localStorage.setItem("recentSearches", JSON.stringify(recent.slice(0, 10)));

            // Navigate
            window.location.href = `search.html?query=${encodeURIComponent(query)}`;
        });

        // === Voice Search ===
        if (voiceBtn) {
            window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

            if (window.SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.lang = 'en-US';
                recognition.interimResults = false;
                recognition.maxAlternatives = 1;

                voiceBtn.addEventListener('click', () => {
                    recognition.start();
                });

                recognition.onresult = function (event) {
                    const transcript = event.results[0][0].transcript;
                    input.value = transcript;
                    form.requestSubmit();
                };

                recognition.onerror = function (event) {
                    console.error("Speech recognition error:", event.error);
                    alert(`Voice recognition error: ${event.error}`);
                };
            } else {
                voiceBtn.disabled = true;
                voiceBtn.title = "Voice recognition not supported";
            }
        }
    });
});
