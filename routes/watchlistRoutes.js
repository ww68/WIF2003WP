// Express route handler for watchlist
const express = require('express');
const router = express.Router();
const User = require('../models/user'); 
const requireAuth = require('../middleware/requireAuth');
const fetchMovieFromTMDb = require('../utils/fetchMovieFromTMDB');
const DAY = 1000 * 60 * 60 * 24;

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
    const filter = req.query.filter || 'all';
    const user = await User.findById(req.session.userId);
    const rawWatchlist = user ? user.watchlist : [];

    const fullWatchlist = await Promise.all(rawWatchlist.map(async (movie) => {
      const now = Date.now();
      const lastUpdated = movie.lastUpdated || 0;
      const isStale = (now - new Date(lastUpdated).getTime()) > 7 * DAY;

      if (isStale || !movie.title) {
        try {
          const apiData = await fetchMovieFromTMDb(movie.id);
          Object.assign(movie, apiData, { lastUpdated: new Date() });
          await user.save(); // update in DB
        } catch (err) {
          console.error(`Failed to update TMDb info for movie ${movie.id}`);
        }
      }

      return movie;
    }));

    const filteredWatchlist = fullWatchlist.filter(movie => {
      if (filter === 'all') return true;
      if (filter === 'watched') return movie.watched;
      if (filter === 'unwatched') return !movie.watched;
    });

    res.render('watchlist', {
      watchlist: fullWatchlist,
      filteredWatchlist,
      filter,
      title: 'Your Watchlist',
      currentPage: 'watchlist'
    });
  } catch (err) {
    console.error('Watchlist error:', err);
    res.status(500).render('error', { error: 'Failed to load watchlist' });
  }
});

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
        
        if (exists) {
            return res.json({ success: false, message: 'Movie already in watchlist' });
        }
        
        if (!movieData.title) {
            const apiData = await fetchMovieFromTMDb(movieData.id);
            Object.assign(movieData, apiData, { lastUpdated: new Date() });
        }

        if (movieData.watched === undefined) {
            movieData.watched = false;
        }
            
        // Add movie to user's watchlist
        user.watchlist.push(movieData);
        await user.save();
            
        res.json({ success: true, message: 'Movie added to watchlist' });        
        
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