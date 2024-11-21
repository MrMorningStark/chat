import { useState, useEffect, useCallback, useRef } from 'react';
import Peer from 'simple-peer';
import { getSocket } from '../services/socket';

export const useWebRTC = (myId) => {
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [stream, setStream] = useState(null);
    const [incomingCall, setIncomingCall] = useState(null);

    const myAudio = useRef();
    const userAudio = useRef();
    const connectionRef = useRef();
    const socketRef = useRef();
    const callAcceptedByRef = useRef(null);

    useEffect(() => {
        const socket = getSocket(myId);
        socketRef.current = socket;
        console.log('Socket initialized for user:', myId);

        // Incoming call handler
        socketRef.current.on('incomingCall', ({ by, signal }) => {
            if (myId === by) return;
            console.log('Received incoming call from:', by);
            console.log('Signal data:', signal);
            setIncomingCall({ from: by, signal });
        });

        // Call accepted handler
        socketRef.current.on('callAccepted', ({ signal, by }) => {
            if (myId == by) return;
            console.log('Call accepted, received signal:', signal);
            callAcceptedByRef.current = by;
            if (connectionRef.current) {
                connectionRef.current.signal(signal);
                setCallAccepted(true);
            } else {
                console.error('No peer connection established');
            }
        });

        // Call ended handler
        socketRef.current.on('callEnded', ({ by }) => {
            if (myId == by) return;
            console.log('Call ended received');
            endCall();
        });

        // Cleanup
        return () => {
            socketRef.current.off('incomingCall');
            socketRef.current.off('callAccepted');
            socketRef.current.off('callEnded');
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [myId]);

    const callUser = useCallback(async (userToCall) => {
        try {
            console.log('Attempting to call user:', userToCall);
            const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log('Got media stream:', mediaStream);
            setStream(mediaStream);

            const peer = new Peer({
                initiator: true,
                trickle: false,
                stream: mediaStream
            });

            peer.on('error', (err) => {
                console.error('Peer error:', err);
            });

            peer.on('signal', (data) => {
                console.log('Generated signal data:', data);

                socketRef.current.emit('callUser', {
                    userToCall: userToCall,
                    signalData: data
                });
            });

            peer.on('stream', (remoteStream) => {
                console.log('Received remote stream');
                if (userAudio.current) {
                    userAudio.current.srcObject = remoteStream;
                }
            });

            connectionRef.current = peer;
            console.log('Peer connection established');

        } catch (err) {
            console.error('Error in callUser:', err);
        }
    }, [myId]);

    const answerCall = useCallback(async () => {
        try {
            console.log('Attempting to answer call from:', incomingCall?.from);
            const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log('Got media stream:', mediaStream);
            setStream(mediaStream);

            const peer = new Peer({
                initiator: false,
                trickle: false,
                stream: mediaStream
            });

            peer.on('error', (err) => {
                console.error('Peer error:', err);
            });

            peer.on('signal', (data) => {
                console.log('Generated answer signal:', data);

                socketRef.current.emit('answerCall', {
                    to: incomingCall.from,
                    signal: data
                });
            });

            peer.on('stream', (remoteStream) => {
                console.log('Received remote stream');
                if (userAudio.current) {
                    userAudio.current.srcObject = remoteStream;
                }
            });

            peer.signal(incomingCall.signal);
            connectionRef.current = peer;
            setCallAccepted(true);
            console.log('Call answered successfully');

        } catch (err) {
            console.error('Error in answerCall:', err);
        }
    }, [incomingCall]);

    const endCall = useCallback(() => {
        try {
            console.log('Ending call');
            if (stream) {
                stream?.getTracks()?.forEach(track => {
                    console.log('Stopping track:', track.kind);
                    track.stop();
                });
            } else {
                console.warn('Stream is null or undefined');
            }
            if (connectionRef.current) {
                console.log('Destroying connection');
                connectionRef.current.destroy(); // Clean up the peer connection
            }
            else {
                console.warn('connectionRef.current is null or undefined');
            }

            // Emit "endCall" if callAcceptedByRef is valid
            if (callAcceptedByRef.current && socketRef.current) {
                console.log('Emitting endCall to:', callAcceptedByRef.current);
                socketRef.current.emit('endCall', {
                    to: callAcceptedByRef.current,
                });
            }
            setCallEnded(true);
            setCallAccepted(false);
            setIncomingCall(null);
            setStream(null);
            callAcceptedByRef.current = null;
            console.log('Call ended successfully');
        } catch (err) {
            console.error('Error in endCall:', err);
        }
    }, [stream, incomingCall]);

    return {
        callAccepted,
        callEnded,
        stream,
        incomingCall,
        myAudio,
        userAudio,
        callUser,
        answerCall,
        endCall
    };
};