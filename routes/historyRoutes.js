const express = require('express');
const router = express.Router();
const User = require('../models/user');
const requireAuth = require('../middleware/requireAuth'); // Ensure the user is logged in

router.get('/', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        if (!user) return res.status(404).send('User not found');
        res.render('history', { user });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error rendering history page');
    }
});

// Save movie to watch history
router.post('/add', requireAuth, async (req, res) => {
    const { movieId, title } = req.body;  // Expecting movie data from frontend
    const userId = req.session.userId;

    console.log("Incoming history add:", req.body);

    if (!movieId || !title) {
        return res.status(400).json({ message: 'Missing movieId or title' });
    }

    try {
        // Find the user by ID and add movie to watchHistory
        const user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Add the movie to the watchHistory and save
        user.watchHistory.push({ movieId, title, timestamp: new Date()});
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
        res.json(user.watchHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))); // Return watch history from MongoDB
    } catch (error) {
        console.error('Error fetching watch history:', error);
        res.status(500).json({ message: 'Error fetching watch history' });
    }
});

// Remove movie from watch history
router.post('/remove', requireAuth, async (req, res) => {
    const { movieId, timestamp } = req.body;
    const userId = req.session.userId;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Find the index of the *exact* movie entry using movieId AND timestamp
        const index = user.watchHistory.findIndex(
            movie =>
                String(movie.movieId) === String(movieId) &&
                new Date(movie.timestamp).toISOString() === new Date(timestamp).toISOString()
        );

        if (index !== -1) {
            user.watchHistory.splice(index, 1); // Removes the entry from the array
            await user.save(); // Saves the updated document to MongoDB
            return res.status(200).json({ message: 'Movie removed from history' });
        } else {
            return res.status(404).json({ message: 'Movie entry not found' });
        }
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

module.exports = router;