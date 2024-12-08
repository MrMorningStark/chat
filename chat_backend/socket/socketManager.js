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
        await this.redisClient.set(`user:${sid}:socketId`, socket.id);

        socket.on('joinRoom', (room) => this.handleJoinRoom(socket, sid, room));
        socket.on('leaveRoom', (room) => this.handleLeaveRoom(socket, sid, room));
        socket.on('sendMessage', (data) => this.handleSendMessage(data, sid));
        // WebRTC Signaling events
        socket.on('callUser', ({ userToCall, signalData }) => this.handleCallUser(sid, userToCall, signalData));
        socket.on('answerCall', ({ to, signal }) => this.handleAnswerCall(sid, to, signal));
        socket.on('onOtherCall', ({ to, message }) => this.handleOnOtherCall(sid, to, message));
        socket.on('endCall', ({ to }) => this.handleEndCall(sid, to));
        socket.on('disconnect', () => this.handleDisconnect(sid));
    }

    async handleCallUser(sid, userToCall, signalData) {
        console.log(`User ${sid} is calling user ${userToCall}`);
        let userSocket = await this.redisClient.get(`user:${userToCall}:socketId`);
        this.io.to(userSocket).emit('incomingCall', { signal: signalData, by: sid });
    }

    async handleAnswerCall(sid, to, signal) {
        console.log(`User ${sid} accepted the call`);
        let userSocket = await this.redisClient.get(`user:${to}:socketId`);
        this.io.to(userSocket).emit('callAccepted', { signal, by: sid });
    }

    async handleOnOtherCall(sid, to, message) {
        const userSocket = await this.redisClient.get(`user:${to}:socketId`);
        if (userSocket) {
            this.io.to(userSocket).emit('callRejected', {
                by: sid,
                message: message
            });
        }
    }


    async handleEndCall(sid, to) {
        console.log(`User ${to} ended the call`);
        let userSocket = await this.redisClient.get(`user:${to}:socketId`);
        this.io.to(userSocket).emit('callEnded', { by: sid });
    }

    handleJoinRoom(socket, sid, room) {
        this.room = room;
        socket.join(room);
        console.log(`User ${sid} joined room: ${room}`);
        this.io.to(room).emit('userStatus', { sid, status: 'online' });
    }

    handleLeaveRoom(socket, sid, room) {
        // this.io.to(room).emit('userStatus', { sid, status: 'offline' });
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

    async handleDisconnect(sid) {
        await this.redisClient.set(`user:${sid}:status`, 'offline');
        await this.redisClient.set(`user:${sid}:socketId`, 'null');
        console.log('User disconnected:', sid);
        if (this.room) {
            this.io.to(this.room).emit('userStatus', { sid, status: 'offline' });
            this.room = null;
        }
    }
}

module.exports = SocketManager;