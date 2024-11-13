import io from 'socket.io-client';

let socket;

export const connectSocket = (sid) => {
    if (socket) return socket;
    socket = io('http://192.168.0.112:5000', {
        auth: { sid },
    });
    return socket;
};

export const getSocket = (sid) => socket || connectSocket(sid);