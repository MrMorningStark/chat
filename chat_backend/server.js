require('dotenv').config();
const express = require('express');
const cors = require('cors');
const https = require('https');
const socketIo = require('socket.io');

const connectDB = require('./config/database');
const connectRedis = require('./config/redis');
const SocketManager = require('./socket/socketManager');
const authMiddleware = require('./middleware/authMiddleware');

class Server {
    constructor() {
        this.app = express();
        this.server = https.createServer(this.app);
        this.io = socketIo(this.server, {
            cors: { origin: '*' }
        });
        this.setupMiddleware();
    }

    async initialize() {
        await connectDB();
        this.redisClient = await connectRedis();
        this.setupRoutes();
        this.setupSocket();
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.set('socketio', this.io);
    }

    setupRoutes() {
        this.app.get('/', (req, res) => res.send('API is working'));
        this.app.use('/api/auth', require('./routes/authRoutes'));
        this.app.use('/api/friends', require('./routes/friends'));
        this.app.use('/api/chat', authMiddleware, require('./routes/chat'));
        this.app.use('/api/users', authMiddleware, require('./routes/statusRoutes')(this.redisClient));
    }

    setupSocket() {
        new SocketManager(this.io, this.redisClient);
    }

    start() {
        const PORT = process.env.PORT || 5000;
        this.server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    }
}

const startServer = async () => {
    const server = new Server();
    await server.initialize();
    server.start();
};

startServer().catch(console.error);