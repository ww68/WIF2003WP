const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    movieId: { type: String, required: true },
    rating: { type: Number, required: true },
    text: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    date: { type: Date, required: true } 
});

module.exports = mongoose.model('Review', reviewSchema);
