const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        googleId: { type: String, unique: true, sparse: true },
        profilePhoto: { type: String },
        role: { type: String, enum: ['user', 'admin'], default: 'user' }
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
