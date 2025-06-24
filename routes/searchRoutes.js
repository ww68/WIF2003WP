const express = require('express');
const router = express.Router();
const axios = require('axios');
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const SearchHistory = require('../models/searchHistory');
const requireAuth = require('../middleware/requireAuth');

console.log('✅ searchRoutes.js loaded');


// POST /search/history - Save search history
router.post('/history', requireAuth, async (req, res) => {
    try {
        const { query, genre = '', year = '', language = '' } = req.body;
        const userId = req.session.userId;

        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        // Find or create history document for the user
        let userHistory = await SearchHistory.findOne({ userId });

        if (!userHistory) {
            userHistory = new SearchHistory({
                userId,
                history: [{
                    query,
                    filters: { genre, year, language },
                    timestamp: new Date()
                }]
            });
        } else {
            // Remove existing entry with same query (if any)
            userHistory.history = userHistory.history.filter(entry => entry.query !== query);

            // Add new entry at the beginning
            userHistory.history.unshift({
                query,
                filters: { genre, year, language },
                timestamp: new Date()
            });

            // Keep only 10 most recent entries
            if (userHistory.history.length > 10) {
                userHistory.history = userHistory.history.slice(0, 10);
            }
        }

        await userHistory.save();

        res.status(200).json({
            success: true,
            message: 'Search history saved/updated',
            search: userHistory
        });

    } catch (error) {
        console.error('Error saving/updating search history:', error);
        res.status(500).json({
            error: 'Failed to save search history',
            details: error.message
        });
    }
});



router.get('/history', requireAuth, async (req, res) => {
    try {
        const userHistory = await SearchHistory.findOne({ userId: req.session.userId });

        res.json({ 
            success: true,
            history: userHistory?.history || []
        });
    } catch (error) {
        console.error('Error fetching search history:', error);
        res.status(500).json({ 
            error: 'Failed to fetch search history',
            details: error.message 
        });
    }
});

router.delete('/history', requireAuth, async (req, res) => {
    try {
        const { query } = req.body;
        const userId = req.session.userId;

        const updated = await SearchHistory.findOneAndUpdate(
            { userId },
            { $pull: { history: { query } } },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ error: 'Query not found in history' });
        }

        res.json({
            success: true,
            message: 'Query deleted from history',
            history: updated.history
        });
    } catch (error) {
        console.error('Error deleting search query:', error);
        res.status(500).json({
            error: 'Failed to delete search query',
            details: error.message
        });
    }
});



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
// searchRoutes.js
router.get('/suggestions', async (req, res) => {
    const query = req.query.query;
    if (!query) return res.json([]);

    try {
        const response = await axios.get('https://api.themoviedb.org/3/search/movie', {
            params: {
                api_key: TMDB_API_KEY,
                query,
                page: 1
            }
        });

        const titles = response.data.results.map(movie => movie.title);
        const uniqueTitles = [...new Set(titles)];
        res.json(uniqueTitles); // ✅ JSON response
    } catch (err) {
        console.error("TMDB error in /search/suggestions:", err.message);
        res.status(500).json([]); // ✅ Still JSON on error
    }
});


module.exports = router;
// API endpoint for search results
router.get('/results', async (req, res) => {
    const {
        query, genre, year, language,
        rating, minDuration, maxDuration, page = 1
    } = req.query;

    const params = {
        api_key: TMDB_API_KEY,
        page
    };

    if (query) {
        params.query = query;
    } else {
        if (genre) params.with_genres = genre;
        if (year) params.primary_release_year = year;
        if (language) params.with_original_language = language;
        if (rating) params['vote_average.gte'] = rating;
        if (minDuration) params['with_runtime.gte'] = minDuration;
        if (maxDuration) params['with_runtime.lte'] = maxDuration;
    }

    const url = query
        ? 'https://api.themoviedb.org/3/search/movie'
        : 'https://api.themoviedb.org/3/discover/movie';

    try {
        const response = await axios.get(url, { params });
        res.json(response.data);
    } catch (error) {
        console.error('TMDB error:', error.message);
        res.status(500).json({ error: 'Failed to fetch data from TMDB' });
    }
});

router.get('/test', (req, res) => {
    res.send('Search routes are working!');
});


module.exports = router;
