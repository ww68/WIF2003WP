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
    firstName: { type: String, required: false },
    lastName: { type: String, required: false },
    phoneNum: { type: String, required: false },
    gender: { type: String, required: false },
    dob: { type: Date, required:false },
    country: { type: String, required: false },
    city: { type: String, required: false },
    profilePicture: { 
        type: String, 
        default: 'images/defaultAvatarProfile.jpg' // Default profile picture path
    },
    genres: { type: [String], default: [] },
    watchHistory: [
        {
            movieId: String,
            title: String,
            timestamp: { type: Date, default: Date.now }
        }
    ]
});

module.exports = mongoose.model('user', userSchema);