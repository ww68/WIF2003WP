require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const User = require('./models/user');
const requireAuth = require('./middleware/requireAuth');

const app = express();
const port = 3019;

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/movie_explorer', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 24 * 60 * 60 * 1000 // 1 day expiration
    }
}));

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;  
  next();
});

app.get('/', (req, res) => {
    res.render('welcome');
});

app.get('/login', (req, res) => {
    res.render('login'); 
});

app.get('/signup', (req, res) => {
    res.render('signup');
});

app.get('/index', (req, res) => {
    const user = req.session.user || {};
    res.render('index', { user, currentPage: 'home' });
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads'));

// Import routes
const watchlistRouter = require('./routes/watchlistRoutes');
const movieRouter = require('./routes/movieRoutes');
const profileRouter = require('./routes/profileRoutes'); 
const trendingRouter = require('./routes/trendingRoutes');
const historyRouter = require('./routes/historyRoutes');
const editprofileRouter = require('./routes/editProfileRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const searchRouter = require('./routes/searchRoutes');
const authRoutes = require('./routes/authRoutes');

// Use routes
app.use('/watchlist', requireAuth, watchlistRouter);
app.use('/movie', movieRouter);
app.use('/trending', trendingRouter);
app.use('/profile', requireAuth, profileRouter);
app.use('/history', requireAuth, historyRouter);
app.use('/editprofile', requireAuth, editprofileRouter);
app.use('/reviews', reviewRouter);
app.use('/search', searchRouter);
app.use('/api/auth', authRoutes);

// Route to get user preferences (returns preferences for authenticated users, null for non-authenticated)
app.get('/index/getPreferences', async (req, res) => {
    try {
        // Check if user is authenticated (adjust this based on your auth system)
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        // Find user in database
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Return user preferences
        res.status(200).json({
            preferences: user.genres || [],
            country: user.country || '',
            isAuthenticated: true
        });
    } catch (error) {
        console.error('Error getting user preferences:', error);
        if (!res.headersSent) {
            return res.status(500).json({ message: 'Server error' });
        }
    }
});

app.get('/api/movie/:id', async (req, res) => {
    try {
        const movieId = req.params.id;
        const apiKey = process.env.TMDB_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'API key not configured' });
        }
        
        // Fetch from TMDB api
        const response = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}`);

        if (!response.ok) {
            throw new Error(`TMDB API error: ${response.status}`);
        }

        const movieData = await response.json();
        
        res.json({
            rating: movieData.vote_average,
            description: movieData.overview,
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch movie details' });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

app.use((req, res) => {
    res.status(404).render('404', { title: 'Page Not Found' });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', {
        title: 'Server Error',
        error: err.message
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

