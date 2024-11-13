const Message = require('../models/Message');

class SocketManager {
    constructor(io, redisClient) {
        this.io = io;
        this.redisClient = redisClient;
        this.room = null;
        this.setupSocketEvents();
    }

    setupSocketEvents() {
        this.io.on('connection', (socket) => {
            this.handleConnection(socket);
        });
    }

    async handleConnection(socket) {
        const { sid } = socket.handshake.auth;
        console.log('A user connected:', sid);

        await this.redisClient.set(`user:${sid}:status`, 'online');

        socket.on('joinRoom', (room) => this.handleJoinRoom(socket, sid, room));
        socket.on('leaveRoom', (room) => this.handleLeaveRoom(socket, sid, room));
        socket.on('sendMessage', (data) => this.handleSendMessage(data, sid));
        socket.on('disconnect', () => this.handleDisconnect(socket, sid));
    }

    handleJoinRoom(socket, sid, room) {
        this.room = room;
        socket.join(room);
        console.log(`User ${sid} joined room: ${room}`);
        this.io.to(room).emit('userStatus', { sid, status: 'online' });
    }

    handleLeaveRoom(socket, sid, room) {
        this.room = null;
        socket.leave(room);
        console.log(`User ${sid} left room: ${room}`);
    }

    async handleSendMessage(data, sid) {
        const { room, to, text } = data;
        const message = new Message({ sender: sid, content: text, recipient: to, room: room });
        await message.save();
        this.io.to(room).emit('receiveMessage', message);
    }

    async handleDisconnect(socket, sid) {
        await this.redisClient.set(`user:${sid}:status`, 'offline');
        console.log('User disconnected:', sid);
        if (this.room) {
            this.io.to(this.room).emit('userStatus', { sid, status: 'offline' });
            this.room = null;
        }
    }
}

module.exports = SocketManager;