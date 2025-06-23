const express = require('express');
const router = express.Router();
const Review = require('../models/reviews');

// POST /reviews - submit a new review
router.post('/', async (req, res) => {
    try {
        const { movieId, rating, text } = req.body;
        const user = req.session.user;

        if (!user) {
            return res.status(401).json({ message: 'You must be logged in to submit a review.' });
        }

        if (!movieId || !rating || !text) {
            return res.status(400).json({ message: 'Missing required review data.' });
        }

        const newReview = new Review({
            movieId,
            rating,
            text,
            userId: user.id,
            date: new Date() 
        });

        await newReview.save();

        res.status(200).json({ message: 'Review submitted successfully.', review: newReview });
    } catch (error) {
        console.error('Error saving review:', error);
        res.status(500).json({ message: 'Server error while submitting review.' });
    }
});

// GET /reviews/:movieId - fetch reviews for a movie
router.get('/:movieId', async (req, res) => {
    try {
        const { movieId } = req.params;
        const reviews = await Review.find({ movieId }).sort({ date: -1 }).populate('userId', 'username');
        
        res.json({ reviews }); 
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ message: 'Server error while fetching reviews.' });
    }
});

module.exports = router;
