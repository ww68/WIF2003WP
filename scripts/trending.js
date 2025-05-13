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
  generateGenreChart()
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
/*
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
*/

async function fetchAllTrendingMovies(time) {
  let page = 1;
  let allMovies = [];

  while (page <= 5) {
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

  const sortedGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const labels = sortedGenres.map(([name]) => name);
  const values = sortedGenres.map(([, count]) => count);
  const totalGenres = values.reduce((sum, count) => sum + count, 0);
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
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (context) => `${context.parsed.y}%`
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
        },
        y: {
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
/*
window.addEventListener('DOMContentLoaded', () => {
  modal.classList.add('show'); // Show chart modal
  generateGenreChart();        // Generate the chart
});
*/
generateGenreChart();

async function fetchTop5Movies() {
            try {
                const response = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&language=en-US&page=1`);
                const data = await response.json();

                // Get top 5 movies based on popularity
                return data.results.slice(0, 5).map(movie => ({
                    title: movie.title,
                    popularity: movie.popularity,  // Popularity is used as a measure of views
                    posterUrl: `https://image.tmdb.org/t/p/w200${movie.poster_path}`  // Fetching poster image
                }));
            } catch (error) {
                console.error("Error fetching data from TMDb:", error);
                return [];
            }
        }

        // Function to create the Line chart
        async function createChart() {
            // Fetch the top 5 movies data
            const moviesData = await fetchTop5Movies();

            if (moviesData.length === 0) {
                alert('No data available');
                return;
            }

            // Extract the movie titles and popularity for the Line chart
            const movieTitles = moviesData.map(movie => movie.title);
            const moviePopularity = moviesData.map(movie => movie.popularity);

            // Create Line Chart
            const ctx = document.getElementById('top5LineChart').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: movieTitles, // Movie titles on the X-axis
                    datasets: [{
                        label: 'Movie Popularity',
                        data: moviePopularity, // Popularity data on the Y-axis
                        borderColor: '#ff6347', // Line color (tomato red)
                        backgroundColor: 'rgba(255, 99, 132, 0.4)', // Soft fill color
                        borderWidth: 3, // Thicker border for more impact
                        pointBackgroundColor: '#ff6347', // Point color (tomato red)
                        pointBorderColor: '#fff', // White border around points
                        pointBorderWidth: 2, // Border width of points
                        pointRadius: 6, // Larger points for better visibility
                        fill: true,  // Fill the area under the line
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 10, // Set the step size for Y-axis
                                color: '#fff', // Y-axis ticks in white for better contrast
                                font: {
                                    size: 14, // Larger font size for better readability
                                }
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.3)', // Light grid lines for better contrast
                                lineWidth: 0.5, // Thin grid lines
                            },
                            title: {
                                display: true,
                                text: 'Popularity',
                                color: '#fff', // Title color in white
                                font: {
                                    size: 16, // Font size for Y-axis title
                                    weight: 'bold',
                                },
                                padding: {
                                    top: 10
                                }
                            }
                        },
                        x: {
                            ticks: {
                                color: '#fff', // X-axis ticks in white for better contrast
                                font: {
                                    size: 14, // Larger font size for better readability
                                }
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.3)', // Light grid lines for better contrast
                                lineWidth: 0.5, // Thin grid lines
                            },
                            title: {
                                display: true,
                                text: 'Movies',
                                color: '#fff', // Title color in white
                                font: {
                                    size: 16, // Font size for X-axis title
                                    weight: 'bold',
                                },
                                padding: {
                                    top: 10
                                }
                            }
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: 'Top 5 Popular Movies',
                            color: '#fff', // Title color
                            font: {
                                size: 20,
                                weight: 'bold'
                            },
                            padding: {
                                bottom: 10,
                                top:20
                            }
                        },
                        legend: {
                            display: true,  // Show the legend
                            labels: {
                                color: '#fff', // Legend text in white
                                font: {
                                    size: 14, // Larger legend text for readability
                                }
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.7)', // Tooltip background color with transparency
                            titleColor: '#fff', // Title in the tooltip in white
                            bodyColor: '#fff', // Body text in the tooltip in white
                            callbacks: {
                                label: function(tooltipItem) {
                                    return tooltipItem.label + ': ' + tooltipItem.raw.toFixed(2) + ' popularity';
                                }
                            }
                        }
                    }
                }
            });
        }

        // Initialize chart creation
        createChart();

         async function fetchUpcomingMovies() {
            try {
                const response = await fetch(`https://api.themoviedb.org/3/movie/upcoming?api_key=${API_KEY}&language=en-US&page=1`);
                const data = await response.json();
                const movies = data.results.filter(movie => {
                    const releaseDate = new Date(movie.release_date);
                    return releaseDate > new Date(); // Ensure movie release date is in the future
                }).slice(0, 5); // Get the top 5 upcoming movies

                const moviesList = document.getElementById('movies-list');
                moviesList.innerHTML = ''; // Clear the existing list if any

                // Loop through the movies and create HTML elements for each
                movies.forEach((movie, index) => {
                    const listItem = document.createElement('li');
                    listItem.classList.add('table-row');

                    // Create numbered div
                    const movieNumber = document.createElement('div');
                    movieNumber.classList.add('number');
                    movieNumber.textContent = index + 1;

                    // Create movie title div
                    const movieName = document.createElement('div');
                    movieName.classList.add('movie-name');
                    movieName.textContent = movie.title;

                    // Create movie genre div
                    const movieGenre = document.createElement('div');
                    movieGenre.classList.add('movie-genre');
                    movieGenre.textContent = getGenres(movie.genre_ids);

                    // Create movie release date div
                    const movieReleaseDate = document.createElement('div');
                    movieReleaseDate.classList.add('movie-release-date');
                    movieReleaseDate.textContent = movie.release_date;

                    

                    // Append movie poster to the list item
                    listItem.appendChild(movieNumber);
                    listItem.appendChild(movieName);
                    listItem.appendChild(movieGenre);
                    listItem.appendChild(movieReleaseDate);

                    // Append list item to the list
                    moviesList.appendChild(listItem);
                });
            } catch (error) {
                console.error('Error fetching movies:', error);
            }
        }

        // Get the first genre from genre IDs
        function getGenres(genreIds) {
            const genreMap = {
                28: 'Action',
                12: 'Adventure',
                16: 'Animation',
                35: 'Comedy',
                80: 'Crime',
                99: 'Documentary',
                18: 'Drama',
                10751: 'Family',
                14: 'Fantasy',
                36: 'History',
                27: 'Horror',
                10402: 'Music',
                9648: 'Mystery',
                10749: 'Romance',
                878: 'Science Fiction',
                10770: 'TV Movie',
                53: 'Thriller',
                10752: 'War',
                37: 'Western',
            };

            // Return the first genre found, or "Unknown" if no genre is found
            return genreIds.length > 0 ? genreMap[genreIds[0]] : 'Unknown';
        }

        // Fetch and display movies when the page loads
        window.onload = fetchUpcomingMovies;