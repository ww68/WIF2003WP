require('dotenv').config();
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Review = require('../models/reviews');

const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));
const API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/w500';

// Route handler for movie details page
router.get('/:id', async (req, res) => {
    const movieId = req.params.id;
    
    try {
        // Construct API URLs
        const detailsUrl = `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=en-US`;
        const creditsUrl = `${BASE_URL}/movie/${movieId}/credits?api_key=${API_KEY}&language=en-US`;
        const similarUrl = `${BASE_URL}/movie/${movieId}/similar?api_key=${API_KEY}&language=en-US`;
        const videoUrl = `${BASE_URL}/movie/${movieId}/videos?api_key=${API_KEY}&language=en-US`;

        // Fetch all data in parallel
        const [detailsRes, creditsRes, similarRes, videoRes] = await Promise.all([
            fetch(detailsUrl),
            fetch(creditsUrl),
            fetch(similarUrl),
            fetch(videoUrl)
        ]);
        // Parse JSON responses
        const movie = await detailsRes.json();
        const credits = await creditsRes.json();
        const similar = await similarRes.json();
        const videos = await videoRes.json();

        // Check if movie exists
        if (!movie || movie.success === false) {
            return res.status(404).render('error', { 
                message: 'Movie not found',
                error: { status: 404 }
            });
        }

        // Extract director from crew
        const director = credits.crew.find(person => person.job === 'Director')?.name || 'Unknown';

        // Find trailer
        const trailer = videos.results.find(v => v.type === "Trailer" && v.site === "YouTube");

        // Get reviews from MongoDB
        const reviews = await Review.find({ movieId }).sort({ date: -1 }).populate('userId', 'username');

        // Calculate average rating
        const avgRating = reviews.length
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;

        let inWatchlist = false;
        if (req.session.userId) {
        const user = await User.findById(req.session.userId);
        inWatchlist = user ? user.watchlist.some(m => m.id === String(movieId)) : false;
        }

        // Render the EJS template with data
        res.render('movie', {
            movie,
            cast: credits.cast,
            director,
            similar: similar.results,
            trailer,
            reviews,
            avgRating: avgRating || 0,
            inWatchlist  
        });

    } catch (error) {
        console.error("Failed to fetch movie details:", error);
        console.error("Movie ID:", movieId);
        console.error("Error details:", error.message);
        
        // Send simple response instead of trying to render error template
        res.status(500).send(`
            <h1>Error loading movie details</h1>
            <p>Movie ID: ${movieId}</p>
            <p>Error: ${error.message}</p>
            <a href="/index">Go back to home</a>
        `);
    }
});

module.exports = router;