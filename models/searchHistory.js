const mongoose = require('mongoose');

const searchEntrySchema = new mongoose.Schema({
    query: { type: String, required: true },
    filters: {
        genre: { type: String, default: '' },
        year: { type: String, default: '' },
        language: { type: String, default: '' }
    },
    timestamp: { type: Date, default: Date.now }
});

const searchHistorySchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        unique: true
    },
    history: [searchEntrySchema]
});

module.exports = mongoose.model('SearchHistory', searchHistorySchema);
