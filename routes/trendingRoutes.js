const express = require('express');
const axios = require('axios');
const router = express.Router();

const API_KEY = '9a56291f8d522c5f874ed7812f062758';
const BASE_URL = 'https://api.themoviedb.org/3';

const GENRE_MAP = {
    28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy",
    80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family",
    14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music",
    9648: "Mystery", 10749: "Romance", 878: "Science Fiction",
    10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western"
};

router.get('/', async (req, res) => {
    try {
        const timeWindow = req.query.time || 'day';
        const page = parseInt(req.query.page) || 1;
        
        // Fetch trending movies
        const moviesResponse = await axios.get(
            `${BASE_URL}/trending/movie/${timeWindow}?api_key=${API_KEY}&page=${page}`
        );
        
        // Fetch upcoming movies for the sidebar
        const upcomingResponse = await axios.get(
            `${BASE_URL}/movie/upcoming?api_key=${API_KEY}&page=1`
        );
        
        // Fetch popular movies for the line chart
        const popularResponse = await axios.get(
            `${BASE_URL}/movie/popular?api_key=${API_KEY}&page=1`
        );

        res.render('trending', {
            movies: moviesResponse.data.results,
            upcomingMovies: upcomingResponse.data.results.slice(0, 5),
            popularMovies: popularResponse.data.results.slice(0, 5),
            currentPage: page,
            timeWindow,
            GENRE_MAP,
            IMAGE_URL: 'https://image.tmdb.org/t/p/w200'
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', { message: 'Failed to load trending movies' });
    }
});





module.exports = router;