const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: { type: String, ref: 'User', required: true },
    recipient: { type: String, ref: 'User', required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false }
});

module.exports = mongoose.model('Message', messageSchema);
