const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');

// Fetch chat history between two users
router.post('/history', async (req, res) => {
    const { room } = req.body;
    if (!room) {
        return res.status(400).json({ message: 'room parameter is required' });
    }
    try {
        const messages = await Message.find({
            room: room
        }).sort({ timestamp: 1 });  // Sort messages by timestamp in ascending order
        // get that friend

        res.status(200).json({ history: messages });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching chat history', error });
    }
});

// Send a new message
router.post('/send', async (req, res) => {
    const { recipientId, content } = req.body;
    const senderId = req.userId;

    try {
        const newMessage = new Message({
            sender: senderId,
            recipient: recipientId,
            content
        });
        await newMessage.save();

        // Emit a socket event to notify the recipient
        const io = req.app.get('socketio');
        io.to(recipientId).emit('newMessage', newMessage); // Send notification to recipient's socket room

        res.status(200).json({ message: 'Message sent', newMessage });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error sending message', error });
    }
});

router.post('/mark-as-read', async (req, res) => {
    const { messageIds } = req.body; // Array of message IDs to mark as read

    try {
        await Message.updateMany(
            { _id: { $in: messageIds } },
            { $set: { isRead: true } }
        );

        res.status(200).json({ message: 'Messages marked as read' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error marking messages as read', error });
    }
});

module.exports = router;
