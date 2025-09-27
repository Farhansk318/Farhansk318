const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
    },
    resetPasswordOtp: String,
    resetPasswordExpires: Date,
});

module.exports = mongoose.model('User', userSchema);