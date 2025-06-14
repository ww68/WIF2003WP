const express = require('express');
const router = express.Router();
const axios = require('axios');
const TMDB_API_KEY = 'b5ca748da01c92488ef670a84e31c784';

// Search route
router.get('/', async (req, res) => {
    try {
        const query = req.query.query || '';
        const genre = req.query.genre || '';
        const year = req.query.year || '';
        const language = req.query.language || '';
        const page = req.query.page || 1;

        res.render('search', {
            title: query ? `Search: ${query}` : 'Browse Movies',
            query,
            genre,
            year,
            language,
            page
        });
    } catch (error) {
        console.error('Search route error:', error);
        res.status(500).render('error', { title: 'Server Error', error: error.message });
    }
});

// API endpoint for search suggestions
router.get('/suggestions', async (req, res) => {
    try {
        const query = req.query.query;
        if (!query) {
            return res.json([]);
        }

        const response = await axios.get(`https://api.themoviedb.org/3/search/movie`, {
            params: {
                api_key: TMDB_API_KEY,
                query: query,
                page: 1
            }
        });

        const suggestions = response.data.results.slice(0, 5).map(movie => movie.title);
        res.json(suggestions);
    } catch (error) {
        console.error('Suggestions error:', error);
        res.status(500).json({ error: 'Failed to fetch suggestions' });
    }
});

// API endpoint for search results
router.get('/results', async (req, res) => {
    try {
        const { query, genre, year, language, minDuration, maxDuration, minRating, page } = req.query;
        
        let url;
        let params = {
            api_key: TMDB_API_KEY,
            page: page || 1
        };

        if (query) {
            url = 'https://api.themoviedb.org/3/search/movie';
            params.query = query;
        } else {
            url = 'https://api.themoviedb.org/3/discover/movie';
            if (genre) params.with_genres = genre;
            if (year) params.primary_release_year = year;
            if (language) params.with_original_language = language;
            if (minRating) params.vote_average_gte = minRating;
            if (minDuration) params.with_runtime_gte = minDuration;
            if (maxDuration) params.with_runtime_lte = maxDuration;
        }

        const response = await axios.get(url, { params });
        res.json(response.data);
    } catch (error) {
        console.error('Search API error:', error);
        res.status(500).json({ error: 'Failed to fetch search results' });
    }
});

module.exports = router;
