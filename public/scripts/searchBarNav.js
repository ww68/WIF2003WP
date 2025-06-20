const TMDB_API_KEY = 'b5ca748da01c92488ef670a84e31c784';
const API_BASE = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w200';

// scripts/searchBarNav.js
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
        dropdown.style.backgroundColor = "#212529";
        dropdown.style.border = "1px solid #343a40";
        form.style.position = "relative";
        form.appendChild(dropdown);

        const loadSuggestions = async () => {
            const searches = await loadRecentSearches();
            dropdown.innerHTML = "";
            
            if (searches.length === 0) {
                dropdown.style.display = "none";
                return;
            }

            searches.forEach(search => {
                const li = document.createElement("li");
                li.className = "list-group-item d-flex justify-content-between align-items-center bg-dark text-white border-secondary";

                const text = document.createElement("span");
                text.textContent = search.query;
                text.className = "flex-grow-1";
                text.style.cursor = "pointer";
                text.onclick = () => {
                    input.value = search.query;
                    form.requestSubmit();
                };

                const deleteBtn = document.createElement("button");
                deleteBtn.innerHTML = `<i class="fas fa-trash-alt text-white"></i>`;
                deleteBtn.className = "btn deleteBtn p-1";
                deleteBtn.onclick = async (e) => {
                    e.stopPropagation();
                    const success = await deleteSearchHistory(search.query);
                    if (success) {
                        loadSuggestions();
                    }
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
                loadSuggestions();
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
                            form.requestSubmit();
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

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const query = input.value.trim();
            if (!query) return;

            // Save to search history
            await saveSearchHistory(query, {});
            
            window.location.href = `/search?query=${encodeURIComponent(query)}`;
        });

        // Voice search
        if (voiceBtn) {
            window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

            if (window.SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.lang = 'en-US';
                recognition.interimResults = false;
                recognition.maxAlternatives = 1;

                voiceBtn.addEventListener('click', async () => {
                    recognition.start();
                });

                recognition.onresult = async function(event) {
                    const transcript = event.results[0][0].transcript;
                    input.value = transcript;
                    
                    // Save voice search to history
                    await saveSearchHistory(transcript, {});
                    form.requestSubmit();
                };

                recognition.onerror = function(event) {
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

// Shared functions with search.js
async function saveSearchHistory(query, filters = {}) {
    try {
        const response = await fetch('/search/history', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query,
                genre: filters.genre || '',
                year: filters.year || '',
                language: filters.language || ''
            }),
            credentials: 'include'
        });
        
        return response.ok;
    } catch (error) {
        console.error('Error saving search history:', error);
        return false;
    }
}

async function loadRecentSearches() {
    try {
        const response = await fetch('/search/history', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            return data.history || [];
        }
        return [];
    } catch (error) {
        console.error('Error loading recent searches:', error);
        return [];
    }
}

async function deleteSearchHistory(query) {
    try {
        const response = await fetch('/search/history', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query }),
            credentials: 'include'
        });
        return response.ok;
    } catch (error) {
        console.error('Error deleting search:', error);
        return false;
    }
}
