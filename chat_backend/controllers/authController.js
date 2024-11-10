// controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Register a new user
exports.register = async (req, res) => {
    const { username, password, email } = req.body;
    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }

        // Create and save the new user
        const user = new User({ username, password, email });
        await user.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'User registration failed' });
    }
};

// Login user
exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'User does not exist' });
        }

        const isPasswordCorrect = await user.comparePassword(password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ error: 'Incorrect password' });
        }

        // If both username and password are correct
        const token = jwt.sign({ userId: user._id, sid: user.sid }, process.env.JWT_SECRET);
        delete user.password;
        res.json({ token, user });

    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
};

