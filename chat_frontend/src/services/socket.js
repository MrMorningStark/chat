import io from 'socket.io-client';

let socket;

export const connectSocket = (sid) => {
    socket = io('http://localhost:5000', {
        query: { sid }
    });
    return socket;
};

export const getSocket = () => socket;