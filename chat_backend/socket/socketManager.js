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
        // WebRTC Signaling events
        socket.on('callUser', ({ userToCall, signalData, from }) => this.handleCallUser(socket, userToCall, signalData, from));
        socket.on('answerCall', ({ to, signal }) => this.handleAnswerCall(socket, sid, to, signal));
        socket.on('endCall', ({ to }) => this.handleEndCall(socket, sid, to));
        socket.on('disconnect', () => this.handleDisconnect(socket, sid));
    }

    handleCallUser(socket, userToCall, signalData, from) {
        let room = `chat_${[userToCall, from].sort().join('_')}`;
        console.log(`User ${from} is calling user ${userToCall} in room: ${room}`);
        this.io.to(room).emit('incomingCall', { signal: signalData, from });
    }

    handleAnswerCall(socket, sid, to, signal) {
        let room = `chat_${[sid, to].sort().join('_')}`;
        console.log(`User ${to} accepted the call in room: ${room}`);
        this.io.to(room).emit('callAccepted', { signal, by: to });
    }

    handleEndCall(socket, sid, to) {
        let room = `chat_${[sid, to].sort().join('_')}`;
        console.log(`User ${to} ended the call in room: ${room}`);
        this.io.to(room).emit('callEnded');
    }

    handleJoinRoom(socket, sid, room) {
        this.room = room;
        socket.join(room);
        console.log(`User ${sid} joined room: ${room}`);
        this.io.to(room).emit('userStatus', { sid, status: 'online' });
    }

    handleLeaveRoom(socket, sid, room) {
        this.io.to(room).emit('userStatus', { sid, status: 'offline' });
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