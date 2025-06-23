const axios = require('axios');

async function fetchMovieFromTMDb(movieId) {
  const res = await axios.get(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${process.env.TMDB_API_KEY}`);
  const data = res.data;

  return {
    title: data.title,
    year: data.release_date?.split('-')[0],
    img: `https://image.tmdb.org/t/p/w500${data.poster_path}`,
    rating: data.vote_average,
    description: data.overview
  };
}

module.exports = fetchMovieFromTMDb;
