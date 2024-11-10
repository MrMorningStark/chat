const Message = require('../models/Message');

class SocketManager {
    constructor(io, redisClient) {
        this.io = io;
        this.redisClient = redisClient;
        this.setupSocketEvents();
    }

    setupSocketEvents() {
        this.io.on('connection', (socket) => {
            this.handleConnection(socket);
        });
    }

    async handleConnection(socket) {
        const sid = socket.handshake.query.sid;
        console.log('A user connected:', socket.id);

        await this.redisClient.set(`user:${sid}:status`, 'online');

        socket.on('joinRoom', (room) => this.handleJoinRoom(socket, room));
        socket.on('sendMessage', (data) => this.handleSendMessage(data));
        socket.on('disconnect', () => this.handleDisconnect(socket, sid));
    }

    handleJoinRoom(socket, room) {
        socket.join(room);
        console.log(`User ${socket.id} joined room: ${room}`);
    }

    async handleSendMessage(data) {
        const { room, sid, text } = data;
        const message = new Message({ sid, text });
        await message.save();
        this.io.to(room).emit('receiveMessage', message);
    }

    async handleDisconnect(socket, sid) {
        await this.redisClient.set(`user:${sid}:status`, 'offline');
        console.log('User disconnected:', socket.id);
    }
}

module.exports = SocketManager;