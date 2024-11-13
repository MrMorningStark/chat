const express = require('express');
const router = express.Router();

module.exports = (redisClient) => {
    router.get('/:sid/status', async (req, res) => {
        try {
            const { sid } = req.params;
            const status = await redisClient.get(`user:${sid}:status`);
            res.status(200).json({ status: status || 'offline' });
        } catch (error) {
            res.status(500).json({ message: 'Error fetching user status', error });
        }
    });

    return router;
};