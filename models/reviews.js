const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    movieId: { type: String, required: true },
    rating: { type: Number, required: true },
    text: { type: String, required: true },
    userid: { type: String, required: true },
    date: { type: String, required: true } // You can also use type: Date if you prefer
});

module.exports = mongoose.model('Review', reviewSchema);
