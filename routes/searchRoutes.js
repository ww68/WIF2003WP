const express = require('express');
const router = express.Router();
const axios = require('axios');

const TMDB_API_KEY = 'b5ca748da01c92488ef670a84e31c784';
const API_BASE = 'https://api.themoviedb.org/3';

// Search page route
router.get('/', async (req, res) => {
    try {
        // Get initial query from URL parameters
        const query = req.query.query || '';
        
        // Render the search page with initial data
        res.render('search', { 
            title: query ? `Search: ${query}` : 'Browse Movies',
            query: query,
            // You can add more initial data here if needed
        });
    } catch (error) {
        console.error('Error rendering search page:', error);
        res.status(500).send('Internal Server Error');
    }
});

// API endpoint for client-side to fetch movies
router.get('/api/movies', async (req, res) => {
    try {
        const { query, page = 1, genre, year, language, minRating } = req.query;
        
        let url;
        if (query) {
            // Search endpoint for text queries
            url = `${API_BASE}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}`;
        } else {
            // Discover endpoint for browsing/filtering
            url = `${API_BASE}/discover/movie?api_key=${TMDB_API_KEY}&page=${page}`;
            
            // Add filters if they exist
            if (genre) url += `&with_genres=${genre}`;
            if (year) url += `&primary_release_year=${year}`;
            if (language) url += `&with_original_language=${language}`;
            if (minRating) url += `&vote_average.gte=${minRating}`;
        }
        
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching movies:', error);
        res.status(500).json({ error: 'Failed to fetch movies' });
    }
});

module.exports = router;
