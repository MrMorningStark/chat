const express = require('express');
const router = express.Router();
const FriendRequest = require('../models/FriendRequest');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware'); // Middleware to protect routes

// Send Friend Request
router.post('/send-request', authMiddleware, async (req, res) => {
    const { toUserId } = req.body;
    const fromUserId = req.userId;

    try {
        const existingRequest = await FriendRequest.findOne({ fromUserId, toUserId });
        if (existingRequest) {
            return res.status(400).json({ message: 'Friend request already sent' });
        }

        const friendRequest = new FriendRequest({ fromUserId, toUserId });
        await friendRequest.save();

        res.status(200).json({ message: 'Friend request sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error sending friend request', error });
    }
});

// Accept Friend Request
router.post('/accept-request', authMiddleware, async (req, res) => {
    const { requestId } = req.body;

    try {
        const friendRequest = await FriendRequest.findById(requestId);

        if (!friendRequest || friendRequest.status !== 'pending') {
            return res.status(404).json({ message: 'Friend request not found or already handled' });
        }

        friendRequest.status = 'accepted';
        await friendRequest.save();

        // Add each user to the other’s friend list
        await User.findByIdAndUpdate(friendRequest.fromUserId, { $push: { friends: friendRequest.toUserId } });
        await User.findByIdAndUpdate(friendRequest.toUserId, { $push: { friends: friendRequest.fromUserId } });

        res.status(200).json({ message: 'Friend request accepted' });
    } catch (error) {
        res.status(500).json({ message: 'Error accepting friend request', error });
    }
});

// Decline Friend Request
router.post('/decline-request', authMiddleware, async (req, res) => {
    const { requestId } = req.body;

    try {
        const friendRequest = await FriendRequest.findById(requestId);

        if (!friendRequest || friendRequest.status !== 'pending') {
            return res.status(404).json({ message: 'Friend request not found or already handled' });
        }

        friendRequest.status = 'declined';
        await friendRequest.save();

        res.status(200).json({ message: 'Friend request declined' });
    } catch (error) {
        res.status(500).json({ message: 'Error declining friend request', error });
    }
});

// Get Friend List
router.get('/list', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId).populate('friends', '-password');
        res.status(200).json({ friends: user.friends });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching friends list', error });
    }
});

// Get Friend List
router.post('/search', authMiddleware, async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) {
            return res.status(400).json({ message: 'Query parameter is required' });
        }
        const users = await User.find({
            $or: [{ username: { $regex: query, $options: 'i' } }, { email: { $regex: query, $options: 'i' } }],
        }).select('-password').limit(7);

        res.status(200).json({ users: users.filter(user => user._id != req.userId) });
    } catch (error) {
        res.status(500).json({ message: 'Error searching friends', error });
    }
});

// add friend
router.post('/add-friend', authMiddleware, async (req, res) => {
    try {
        const { friendId } = req.body;
        if (!friendId) {
            return res.status(400).json({ message: 'Friend ID is required' });
        }

        const user = await User.findById(req.userId);
        if (user.friends.includes(friendId)) {
            return res.status(400).json({ message: 'You are already friends with this user' });
        }
        const friend = await User.findById(friendId);
        user.friends.push(friendId);
        friend.friends.push(req.userId);

        await user.save();
        await friend.save();
        res.status(200).json({ message: 'Friend added successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error adding friend', error });
    }
});

module.exports = router;
