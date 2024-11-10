const express = require('express');
const router = express.Router();

module.exports = (redisClient) => {
    router.get('/:userId/status', async (req, res) => {
        const { userId } = req.params;
        const status = await redisClient.get(`user:${userId}:status`);
        res.json({ userId, status: status || 'offline' });
    });

    return router;
};