import io from 'socket.io-client';

let socket;

export const connectSocket = (sid) => {
    if (socket) return socket;
    socket = io('https://chat-of3s.onrender.com', {
        auth: { sid },
    });
    return socket;
};

export const getSocket = (sid) => socket || connectSocket(sid);