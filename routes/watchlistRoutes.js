// Express route handler for watchlist
const express = require('express');
const router = express.Router();

// GET /watchlist - Display watchlist with optional filter
router.get('/', (req, res) => {
    // Get filter from query parameter, default to 'all'
    const filter = req.query.filter || 'all';
    
    // Get watchlist from session, database, or however you store it
    // For this example, I'm using session storage
    const watchlist = req.session.watchlist || [];
    
    // Filter the watchlist based on the filter parameter
    let filteredWatchlist = watchlist;
    if (filter === 'watched') {
        filteredWatchlist = watchlist.filter(movie => movie.watched === true);
    } else if (filter === 'unwatched') {
        filteredWatchlist = watchlist.filter(movie => movie.watched === false);
    }
    
    // Render the EJS template with the data
    res.render('watchlist', {
        watchlist: watchlist,
        filteredWatchlist: filteredWatchlist,
        filter: filter,
        title: 'Your Watchlist'
    });
});

// POST /watchlist/remove - Remove movie from watchlist
router.post('/remove', (req, res) => {
    const { movieId } = req.body;
    
    if (!req.session.watchlist) {
        req.session.watchlist = [];
    }
    
    // Remove movie from watchlist
    req.session.watchlist = req.session.watchlist.filter(movie => movie.id !== movieId);
    
    res.json({ success: true });
});

// POST /watchlist/toggle - Toggle watched status
router.post('/toggle', (req, res) => {
    const { movieId } = req.body;
    
    if (!req.session.watchlist) {
        req.session.watchlist = [];
    }
    
    // Find and toggle the movie's watched status
    const index = req.session.watchlist.findIndex(movie => movie.id === movieId);
    if (index !== -1) {
        req.session.watchlist[index].watched = !req.session.watchlist[index].watched;
        res.json({ 
            success: true, 
            watched: req.session.watchlist[index].watched 
        });
    } else {
        res.json({ success: false, error: 'Movie not found' });
    }
});

// POST /watchlist/add - Add movie to watchlist
router.post('/add', (req, res) => {
    const movieData = req.body;
    
    if (!req.session.watchlist) {
        req.session.watchlist = [];
    }
    
    // Check if movie already exists
    const exists = req.session.watchlist.some(movie => movie.id === movieData.id);
    
    if (!exists) {
        // Add watched property if not present
        if (movieData.watched === undefined) {
            movieData.watched = false;
        }
        
        req.session.watchlist.push(movieData);
        res.json({ success: true, message: 'Movie added to watchlist' });
    } else {
        res.json({ success: false, message: 'Movie already in watchlist' });
    }
});

module.exports = router;