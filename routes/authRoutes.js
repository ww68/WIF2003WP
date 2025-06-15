const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/user');

const router = express.Router();

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Handle signup with email verification
router.post('/signup', async (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const username = firstName + " " + lastName;

        const newUser = new User({
            username,
            firstName,
            lastName,
            email,
            password: hashedPassword,
            verificationToken,
            tokenExpiry: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
            isVerified: false
        });

        await newUser.save();

        // Send verification email
        const verificationLink = `${process.env.BASE_URL || 'http://localhost:3019'}/api/auth/verify-email?token=${verificationToken}`;
        
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Verify Your Email - Movie Explorer',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Welcome to Movie Explorer!</h2>
                    <p>Hi ${firstName},</p>
                    <p>Thanks for signing up! Please verify your email address by clicking the button below:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verificationLink}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
                    </div>
                    <p>Or copy and paste this link in your browser:</p>
                    <p><a href="${verificationLink}">${verificationLink}</a></p>
                    <p>This link will expire in 24 hours.</p>
                    <p>If you didn't create an account, please ignore this email.</p>
                </div>
            `
        });

        res.status(200).json({ 
            message: "Signup successful! Please check your email to verify your account.",
            requiresVerification: true 
        });

    } catch (err) {
        console.error("Signup error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// Handle email verification
router.get('/verify-email', async (req, res) => {
    const { token } = req.query;

    try {
        const user = await User.findOne({
            verificationToken: token,
            tokenExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).render('error', {
                title: 'Verification Failed',
                error: 'Invalid or expired verification token. Please sign up again.'
            });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.tokenExpiry = undefined;
        await user.save();

        res.render('verificationSuccess');

    } catch (err) {
        console.error("Verification error:", err);

        res.status(500).render('error', {
            title: 'Verification Error',
            error: 'An error occurred during verification.'
        });
    }
});

// Handle login with verification check
router.post('/login', async (req, res) => {
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

        if (!user.isVerified) {
            return res.status(403).json({ 
                message: "Please verify your email before logging in. Check your inbox for the verification link.",
                requiresVerification: true,
                email: email // Send email back for resend functionality
            });
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

// Resend verification email
router.post('/resend-verification', async (req, res) => {
    const { email } = req.body;
    
    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }
        
        if (user.isVerified) {
            return res.status(400).json({ message: 'Email already verified' });
        }

        const verificationToken = crypto.randomBytes(32).toString('hex');
        user.verificationToken = verificationToken;
        user.tokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
        await user.save();

        const verificationLink = `${process.env.BASE_URL || 'http://localhost:3019'}/api/auth/verify-email?token=${verificationToken}`;
        
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Resend Verification - Movie Explorer',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Email Verification</h2>
                    <p>Please verify your email address by clicking the button below:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verificationLink}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
                    </div>
                    <p>This link will expire in 24 hours.</p>
                </div>
            `
        });

        res.json({ message: 'Verification email sent. Please check your inbox.' });
    } catch (err) {
        console.error("Resend verification error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;