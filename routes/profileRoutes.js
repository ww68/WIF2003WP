const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const User = require('../models/user');
const SearchHistory = require('../models/searchHistory'); // Adjust path as needed
const requireAuth = require('../middleware/requireAuth');

// Route to view the profile
router.get('/', requireAuth, async (req, res) => {
    console.log("User ID from session:", req.session.userId); // Log userId from session
    try {
        const user = await User.findById(req.session.userId); // Fetch user by ID stored in session
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.render('profile', { title: 'Profile Page', user }); // Render profile.ejs with user data
    } catch (err) {
        console.error(err);
        res.status(500).send('Error retrieving profile data');
    }
});

router.get('/getHistory', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user.watchHistory);  // Return watch history from MongoDB
    } catch (error) {
        console.error('Error fetching watch history:', error);
        res.status(500).json({ message: 'Error fetching watch history' });
    }
});

router.post('/updateGenres', requireAuth, async (req, res) => {
    const { selectedGenres } = req.body;
    try {
        const updatedUser = await User.findByIdAndUpdate(req.session.userId, {
            genres: selectedGenres
        }, { new: true });

        req.session.user = updatedUser; // Update session data
        return res.json({ message: 'Preferences saved successfully' }); // Send success message
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating genres');
    }
});

router.post('/changePassword', requireAuth, async (req, res) => {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    const userId = req.session.userId;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Missing current or new password' });
    }
    
    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error('Password change error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Failed to logout');
        }
        res.clearCookie('connect.sid'); // Clear the session cookie
        res.redirect('/login'); // Redirect to login page
    });
});

router.post('/deleteAccount', requireAuth, async (req, res) => {
    const userId = req.session.userId;

    try {
        await SearchHistory.deleteOne({ userId: userId });
        // Delete the user's account from the database
        await User.findByIdAndDelete(userId);
        
        // Destroy the session and clear the session cookie
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).send('Failed to log out after deletion');
            }
            res.clearCookie('connect.sid'); // Clear the session cookie
            res.redirect('/login'); // Redirect to login page after deletion
        });
    } catch (err) {
        console.error('Error deleting account:', err);
        res.status(500).send('Error deleting account');
    }
});



module.exports = router;
