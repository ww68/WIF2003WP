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

router.post('/add', requireAuth, async (req, res) => {
    const { movieId, title, timestamp } = req.body;
    const userId = req.session.userId;

    if (!movieId || !title) {
        return res.status(400).json({ message: 'Missing movieId or title' });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Check if the same movie was added today
        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        // Find existing entry for this movie today
        const existingTodayIndex = user.watchHistory.findIndex(entry => 
            String(entry.movieId) === String(movieId) && 
            new Date(entry.timestamp) >= startOfToday &&
            new Date(entry.timestamp) < endOfToday
        );

        if (existingTodayIndex !== -1) {
            // Remove the old entry and add the new one
            user.watchHistory.splice(existingTodayIndex, 1);
            user.watchHistory.push({ 
                movieId: String(movieId), 
                title, 
                timestamp: new Date(timestamp)
            });
            await user.save();
            return res.status(200).json({ message: 'Movie history updated for today' });
        }

        // Add new entry if no recent duplicate found
        user.watchHistory.push({ 
            movieId: String(movieId), 
            title, 
            timestamp: new Date(timestamp)
        });
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

        // Remove ALL entries for this movieId (to handle any existing duplicates)
        const initialLength = user.watchHistory.length;
        user.watchHistory = user.watchHistory.filter(
            movie => String(movie.movieId) !== String(movieId)
        );

        if (user.watchHistory.length < initialLength) {
            await user.save();
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