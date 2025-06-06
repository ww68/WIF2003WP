// Express route handler for watchlist
const express = require('express');
const router = express.Router();
const User = require('../models/user'); 
const requireAuth = require('../middleware/requireAuth');

router.get('/check/:id', requireAuth, async (req, res) => {
  try {
    const movieId = req.params.id;
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ inWatchlist: false });
    }
    // Look for that movieId in the user’s watchlist array
    const inWatchlist = user.watchlist.some(movie => movie.id === movieId);
    return res.json({ inWatchlist });
  } catch (err) {
    console.error('Watchlist check error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', requireAuth, async (req, res) => {
    try {
        // Get filter from query parameter, default to 'all'
        const filter = req.query.filter || 'all';
        
        // Get user's watchlist from database
        const user = await User.findById(req.session.userId);
        const watchlist = user ? user.watchlist : [];
        
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
            title: 'Your Watchlist',
            currentPage: 'watchlist'
        });
        
    } catch (error) {
        console.error('Error fetching watchlist:', error);
        res.status(500).render('error', { 
            title: 'Server Error',
            error: 'Failed to load watchlist' 
        });
    }
});

// POST /watchlist/add - Add movie to watchlist
router.post('/add', requireAuth, async (req, res) => {
    try {
        const movieData = req.body;
        const userId = req.session.userId;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }
        
        // Check if movie already exists
        const exists = user.watchlist.some(movie => movie.id === movieData.id);
        
        if (!exists) {
            // Add watched property if not present
            if (movieData.watched === undefined) {
                movieData.watched = false;
            }
            
            // Add movie to user's watchlist
            user.watchlist.push(movieData);
            await user.save();
            
            res.json({ success: true, message: 'Movie added to watchlist' });
        } else {
            res.json({ success: false, message: 'Movie already in watchlist' });
        }
        
    } catch (error) {
        console.error('Error adding to watchlist:', error);
        res.json({ success: false, message: 'Server error' });
    }
});

// POST /watchlist/remove - Remove movie from watchlist
router.post('/remove', requireAuth, async (req, res) => {
    try {
        const { movieId } = req.body;
        const userId = req.session.userId;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }
        
        // Remove movie from watchlist
        user.watchlist = user.watchlist.filter(movie => movie.id !== movieId);
        await user.save();
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('Error removing from watchlist:', error);
        res.json({ success: false, message: 'Server error' });
    }
});

// POST /watchlist/toggle - Toggle watched status
router.post('/toggle', requireAuth, async (req, res) => {
    try {
        const { movieId } = req.body;
        const userId = req.session.userId;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }
        
        // Find and toggle the movie's watched status
        const movie = user.watchlist.find(movie => movie.id === movieId);
        if (movie) {
            movie.watched = !movie.watched;
            await user.save();
            
            res.json({ 
                success: true, 
                watched: movie.watched 
            });
        } else {
            res.json({ success: false, error: 'Movie not found' });
        }
        
    } catch (error) {
        console.error('Error toggling watched status:', error);
        res.json({ success: false, message: 'Server error' });
    }
});

// GET /watchlist/data - API endpoint to get watchlist data
router.get('/data', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        const watchlist = user ? user.watchlist : [];
        res.json({ success: true, watchlist: watchlist });
    } catch (error) {
        console.error('Error fetching watchlist data:', error);
        res.json({ success: false, message: 'Server error' });
    }
});

module.exports = router;