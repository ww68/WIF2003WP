const express = require('express');
const router = express.Router();
const User = require('../models/user');
const requireAuth = require('../middleware/requireAuth'); // Ensure the user is logged in


router.get('/', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        if (!user) return res.status(404).send('User not found');
        res.render('history', { user });  // Make sure you have 'views/history.ejs'
    } catch (err) {
        console.error(err);
        res.status(500).send('Error rendering history page');
    }
});

// Save movie to watch history
router.post('/add', requireAuth, async (req, res) => {
    const { movieId, title } = req.body;  // Expecting movie data from frontend
    const userId = req.session.userId;

    try {
        // Find the user by ID and add movie to watchHistory
        const user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Check if movie is already in the watchHistory
        const movieExists = user.watchHistory.some(movie => movie.movieId === movieId);
        if (movieExists) {
            return res.status(400).json({ message: 'Movie already in history' });
        }

        // Add the movie to the watchHistory and save
        user.watchHistory.push({ movieId, title });
        await user.save();

        res.status(200).json({ message: 'Movie added to watch history' });
    } catch (error) {
        console.error('Error adding to watch history:', error);
        res.status(500).json({ message: 'Error adding to watch history' });
    }
});

router.get('/getHistory', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user.watchHistory);  // Return watch history from MongoDB
    } catch (error) {
        console.error('Error fetching watch history:', error);
        res.status(500).json({ message: 'Error fetching watch history' });
    }
});

// Remove movie from watch history
router.post('/remove', requireAuth, async (req, res) => {
    const { movieId } = req.body;
    const userId = req.session.userId;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Remove the movie from watch history
        user.watchHistory = user.watchHistory.filter(movie => movie.movieId !== movieId);
        await user.save();

        res.status(200).json({ message: 'Movie removed from history' });
    } catch (error) {
        console.error('Error removing from watch history:', error);
        res.status(500).json({ message: 'Error removing from watch history' });
    }
});

// Clear all watch history
router.post('/clear', requireAuth, async (req, res) => {
    const userId = req.session.userId;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        user.watchHistory = [];
        await user.save();

        res.status(200).json({ message: 'History cleared' });
    } catch (error) {
        console.error('Error clearing watch history:', error);
        res.status(500).json({ message: 'Error clearing watch history' });
    }
});

// Get all watch history for the logged-in user
router.get('/:userId', requireAuth, async (req, res) => {
    const userId = req.params.userId;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user.watchHistory);
    } catch (error) {
        console.error('Error fetching watch history:', error);
        res.status(500).json({ message: 'Error fetching watch history' });
    }
});

module.exports = router;