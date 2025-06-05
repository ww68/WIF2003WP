const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    id: { type: String, required: true },
    title: { type: String, required: true },
    year: { type: String },
    rating: { type: String },
    description: { type: String },
    img: { type: String },
    watched: { type: Boolean, default: false },
    addedAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    watchlist: [movieSchema],
    // createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('user', userSchema);