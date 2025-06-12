const express = require('express');
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

const fs = require('fs');
const uploadDir = 'uploads/profile-pictures/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up Multer upload
const upload = multer({ storage: storage });

router.get('/', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId); // Fetch user by ID stored in session

        // Format the date of birth to yyyy-mm-dd
        const formattedDOB = user.dob ? user.dob.toISOString().split('T')[0] : ''; // Ensure valid format 

        res.render('editprofile', {    
            title: 'Edit Profile',
            user: { ...user.toObject(), dob: formattedDOB }
         });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error retrieving user data for editing');
    }
});

// Route to update user profile
router.post('/updateProfile', requireAuth, upload.single('profilePicture'), async (req, res) => {
    const { firstName, lastName, phoneNum, gender, dob, country, city } = req.body;

    // Ensure dob is correctly formatted to yyyy-mm-dd
    const formattedDOB = new Date(dob).toISOString().split('T')[0]; 
    const profilePictureUrl = req.file ? `/uploads/profile-pictures/${req.file.filename}` : null;

    // Prepare update object
    const updateFields = {
        firstName,
        lastName,
        phoneNum,
        gender,
        dob: formattedDOB,
        country,
        city,
    };

    // Only set profilePicture if a new file was uploaded
    if (profilePictureUrl) {
        updateFields.profilePicture = profilePictureUrl;
    }

    try {
        const updatedUser = await User.findByIdAndUpdate(req.session.userId, updateFields, { new: true });

        req.session.user = {
            _id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            profilePicture: updatedUser.profilePicture,
            ...updateFields
        };
        res.redirect('/profile');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating profile');
    }
});

module.exports = router;