const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
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
    secret: 'yourSecretKey',
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
    res.sendFile(path.join(__dirname, 'welcome.html'));
});

app.get('/index', (req, res) => {
    const user = req.session.user || {};
    res.render('index', { user, currentPage: 'home' });
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));
app.use(express.json());
app.use(express.static('public'));

// Import routes
const watchlistRouter = require('./routes/watchlistRoutes');
const movieRouter = require('./routes/movieRoutes');
const profileRouter = require('./routes/profileRoutes'); 
const trendingRouter = require('./routes/trendingRoutes');
const historyRouter = require('./routes/historyRoutes');
const editProfileRouter = require('./routes/editProfileRoutes');



// Use routes
app.use('/watchlist', requireAuth, watchlistRouter);
app.use('/movie', movieRouter);
app.use('/trending', trendingRouter);
app.use('/profile', requireAuth, profileRouter);
app.use('/history', requireAuth, historyRouter);
app.use('/editprofile', requireAuth, editProfileRouter);


app.post("/signup", async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username,
            email,
            password: hashedPassword
        });

        await newUser.save();

        res.status(200).json({ message: "Signup successful" });
    } catch (err) {
        console.error("Signup error:", err);
        res.status(500).json({ message: "Server error" });
    }
});


app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // Store user ID in session for watchlist access
        req.session.userId = user._id;
        req.session.user = {
            id: user._id,
            username: user.username,
            email: user.email
        };

        res.status(200).json({ message: "Login successful" });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: "Server error" });
    }
});


app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login.html');
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

