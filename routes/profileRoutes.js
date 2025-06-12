const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const User = require('../models/user');
const requireAuth = require('../middleware/requireAuth');

// Set up Multer storage engine for storing files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/profile-pictures/'); // Folder to store profile pictures
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    }
});

// Set up Multer upload
const upload = multer({ storage: storage });

router.post('/updateProfilePicture', requireAuth, upload.single('profilePicture'), async (req, res) => {
    const { userId } = req.session; // Assume user ID is stored in the session
    const profilePictureUrl = req.file ? `/uploads/profile-pictures/${req.file.filename}` : null;

    try {
        // Update the user's profile picture URL in the database
        const updatedUser = await User.findByIdAndUpdate(userId, {
            profilePicture: profilePictureUrl || 'images/deafultAvatarProfile.jpg'
        }, { new: true });

        req.session.user = updatedUser; // Update session data
        res.redirect('/'); // Redirect to the profile page after updating
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating profile picture');
    }
});

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
        res.redirect('/');
        res.json({ message: 'Preferences saved successfully' }); // Send success message
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating genres');
    }
});

router.post('/changePassword', requireAuth, async (req, res) => {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    const userId = req.session.userId;

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
