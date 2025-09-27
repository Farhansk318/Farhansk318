require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path'); // Required for serving static files

const User = require('/User.js'); // Updated path

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(cors());
app.use(express.json());
// Serve the frontend files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname)));

// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected successfully.'))
    .catch(err => console.error('MongoDB connection error:', err));

// --- Nodemailer Setup ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});


// --- API ROUTES (Moved from auth.js) ---

// 1. Register a new user
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ email, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Error registering user', error });
    }
});

// 2. Login a user
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        res.status(200).json({ message: 'Login successful!' });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error });
    }
});

// 3. Forgot Password - Send OTP
app.post('/api/auth/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = Date.now() + 300000; // 5 minutes

        user.resetPasswordOtp = otp;
        user.resetPasswordExpires = expires;
        await user.save();

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your Password Reset OTP for HomeTech Spares',
            text: `Your OTP is: ${otp}. It will expire in 5 minutes.`,
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'OTP sent to your email.' });
    } catch (error) {
        res.status(500).json({ message: 'Error sending OTP', error });
    }
});

// 4. Verify OTP
app.post('/api/auth/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({
            email,
            resetPasswordOtp: otp,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired OTP.' });
        }
        res.status(200).json({ message: 'OTP verified successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Error verifying OTP', error });
    }
});

// 5. Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const user = await User.findOne({
            email,
            resetPasswordOtp: otp,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired OTP. Please try again.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetPasswordOtp = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).json({ message: 'Password has been reset successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Error resetting password', error });
    }
});


// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});