import { useState, useEffect, useCallback, useRef } from 'react';
import Peer from 'simple-peer';
import { getSocket } from '../services/socket';

export const useWebRTC = (myId) => {
    const [callStarted, setCallStarted] = useState(false);
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [stream, setStream] = useState(null);
    const [incomingCall, setIncomingCall] = useState(null);
    const [callDuration, setCallDuration] = useState(0);

    const myAudio = useRef();
    const userAudio = useRef();
    const connectionRef = useRef();
    const socketRef = useRef();
    const callByRef = useRef(null);
    const callDurationTimerRef = useRef(null);
    const ringtoneRef = useRef(null);
    useEffect(() => {
        // audio in public folder
        ringtoneRef.current = new Audio(require('../audio/ring.mp3'));
        // Configure audio to loop
        if (ringtoneRef.current) {
            ringtoneRef.current.loop = true;
        }
        const socket = getSocket(myId);
        socketRef.current = socket;
        console.log('Socket initialized for user:', myId);

        // Incoming call handler
        socketRef.current.on('incomingCall', ({ by, signal }) => {
            console.log('Received incoming call from:', by);
            console.log('Signal data:', signal);
            // Check if user is already in a call or has a pending call
            if (callStarted || incomingCall || callAccepted) {
                console.log('User is busy. Emitting onOtherCall event');
                socketRef.current.emit('onOtherCall', {
                    to: by,
                    message: 'User is currently in another call or has a pending call'
                });
                return; // Prevent processing the incoming call
            }
            callByRef.current = by;
            setIncomingCall({ from: by, signal });
            startRingtone();
        });

        // Call accepted handler
        socketRef.current.on('callAccepted', ({ signal, by }) => {
            stopRingtone();
            setCallStarted(true);
            // Start call duration timer
            callDurationTimerRef.current = setInterval(() =>
                setCallDuration((prev) => prev + 1000), 1000);

            console.log('Call accepted, received signal:', signal);
            callByRef.current = by;

            if (connectionRef.current) {
                connectionRef.current.signal(signal);
                setCallAccepted(true);
            } else {
                console.error('No peer connection established');
            }
        });

        socketRef.current.on('callRejected', ({ by, message }) => {
            console.log('Call rejected:', message);
            stopRingtone();
            endCall(false);
        });

        // Call ended handler
        socketRef.current.on('callEnded', ({ by }) => {
            stopRingtone();
            endCall(false);
        });

        // Cleanup
        return () => {
            socketRef.current.off('incomingCall');
            socketRef.current.off('callAccepted');
            socketRef.current.off('callRejected');
            socketRef.current.off('callEnded');
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            if (ringtoneRef.current) {
                ringtoneRef.current.pause();
                ringtoneRef.current = null;
            }

        };
    }, [myId]);

    const startRingtone = useCallback(() => {
        if (ringtoneRef.current) {
            ringtoneRef.current.currentTime = 0; // Reset to start
            ringtoneRef.current.play().catch(error => {
                console.warn('Error playing ringtone:', error);
            });
        }
    }, []);

    const stopRingtone = useCallback(() => {
        if (ringtoneRef.current) {
            ringtoneRef.current.pause();
            ringtoneRef.current.currentTime = 0;
        }
    }, []);

    const callUser = useCallback(async (userToCall) => {
        try {
            setCallStarted(true);
            startRingtone();
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
                setCallStarted(false);
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
            stopRingtone();
            console.log('Attempting to answer call from:', incomingCall?.from);
            const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log('Got media stream:', mediaStream);
            setStream(mediaStream);

            // Creating Peer instance looks good
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
            setCallStarted(true);

            // Start call duration timer
            callDurationTimerRef.current = setInterval(() =>
                setCallDuration((prev) => prev + 1000), 1000);

            console.log('Call answered successfully');

        } catch (err) {
            console.error('Error in answerCall:', err);
            // Consider adding error handling UI or toast
        }
    }, [incomingCall]);

    const endCall = useCallback((shouldEmitEndCall = true) => {
        try {
            stopRingtone();
            // Clear call duration timer
            if (callDurationTimerRef.current) {
                clearInterval(callDurationTimerRef.current);
                callDurationTimerRef.current = null;
                setCallDuration(0);
            }

            // Stop media tracks
            if (stream) {
                stream.getTracks().forEach(track => {
                    console.log(`Stopping ${track.kind} track`);
                    track.stop();
                });
            } else {
                console.warn('Stream is null or undefined');
            }

            // Destroy peer connection
            if (connectionRef.current) {
                console.log('Destroying peer connection');
                connectionRef.current.destroy();
                connectionRef.current = null;
            } else {
                console.warn('connectionRef.current is null or undefined');
            }

            // Emit end call event if required
            if (shouldEmitEndCall && socketRef.current && callByRef.current) {
                console.log('Emitting endCall to:', callByRef.current);
                socketRef.current.emit('endCall', {
                    to: callByRef.current,
                });
            }

            // Reset state
            setCallStarted(false);
            setCallEnded(true);
            setCallAccepted(false);
            setIncomingCall(null);
            setStream(null);

            // Reset refs
            callByRef.current = null;

            console.log('Call ended successfully');
        } catch (err) {
            console.error('Error in endCall:', err);
        }
    }, [stream, incomingCall]);

    return {
        callStarted,
        callAccepted,
        callEnded,
        stream,
        incomingCall,
        myAudio,
        userAudio,
        callUser,
        answerCall,
        endCall,
        callDuration,
        startRingtone,
        stopRingtone
    };
};