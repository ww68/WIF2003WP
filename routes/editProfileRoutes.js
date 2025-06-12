const express = require('express');
const router = express.Router();
const User = require('../models/user');
const requireAuth = require('../middleware/requireAuth'); // Ensure the user is logged in

router.get('/', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId); // Fetch user by ID stored in session

        // Format the date of birth to yyyy-mm-dd
        const formattedDOB = user.dob ? user.dob.toISOString().split('T')[0] : ''; // Ensure valid format 
        res.render('editprofile', { title: 'Edit Profile', user: { ...user, dob: formattedDOB } });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error retrieving user data for editing');
    }
});

// Route to update user profile
router.post('/updateProfile', requireAuth, async (req, res) => {
    const { firstName, lastName, phoneNum, gender, dob, country, city } = req.body;

    // Ensure dob is correctly formatted to yyyy-mm-dd
    const formattedDOB = new Date(dob).toISOString().split('T')[0]; 

    try {
        const updatedUser = await User.findByIdAndUpdate(req.session.userId, {
            firstName,
            lastName,
            phoneNum,
            gender,
            dob: formattedDOB,
            country,
            city
        }, { new: true });

        req.session.user = updatedUser; // Update session data
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating profile');
    }
});