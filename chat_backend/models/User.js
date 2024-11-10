// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { nanoid } = require('nanoid');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    sid: { type: String, unique: true },
    avatar: { type: String, default: '' },
}, {
    timestamps: true  // Adds createdAt and updatedAt fields
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        this.password = await bcrypt.hash(this.password, 10);
        if (!this.sid) {
            this.sid = nanoid(6);
        }
        if (!this.avatar) {
            this.avatar = `https://api.dicebear.com/9.x/adventurer/webp?seed=${encodeURIComponent(this.username)}`;
        }
        next();
    } catch (error) {
        next(error);
    }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
