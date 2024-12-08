import { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { getSocket } from '../services/socket';
import moment from 'moment';
import {
    Box,
    Flex,
    Avatar,
    Text,
    Input,
    Button,
    useColorModeValue,
    IconButton,
    HStack,
    VStack,
    useColorMode,
    Alert,
    AlertTitle,
    AlertDescription,
    ButtonGroup
} from '@chakra-ui/react';
import { FiArrowLeft, FiMoreVertical, FiPhone, FiPhoneCall, FiVideo } from 'react-icons/fi';
import api from '../services/api';
import { useWebRTC } from '../hooks/useWebRTC';

const ChatRoom = () => {
    const { sid } = useParams();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [friend, setFriend] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isOnline, setIsOnline] = useState('offline');
    const { user } = useSelector((state) => state.auth);
    const messagesEndRef = useRef(null);
    const room = useRef(null);
    const { colorMode } = useColorMode();

    // Color mode values
    const bg = useColorModeValue('white', 'gray.800');
    const headerBg = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const messageBg = useColorModeValue('gray.100', 'gray.700');
    const userMessageBg = useColorModeValue('blue.500', 'blue.600');
    const inputBg = useColorModeValue('white', 'gray.700');

    const {
        callStarted,
        callAccepted,
        callUser,
        endCall,
    } = useWebRTC(user.sid);

    useEffect(() => {
        room.current = `chat_${[user.sid, sid].sort().join('_')}`;
        loadFriend();
        loadMessages();
        loadUserStatus();
        const socket = getSocket(user.sid);
        socket.emit('joinRoom', room.current);

        socket.on('receiveMessage', (message) => {
            setMessages((prev) => [...prev, message]);
        });

        socket.on('userStatus', (data) => {
            let { sid, status } = data;
            if (sid != user.sid) {
                setIsOnline(status);
            }
        });

        return () => {
            socket.emit('leaveRoom', room.current);
        };
    }, [sid]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadUserStatus = async () => {
        try {
            const response = await api.get(`users/${sid}/status`);
            if (response.data.status) {
                setIsOnline(response.data.status);
            }
        } catch (error) {
            console.error('Error loading user status:', error);
        }
    }


    const loadFriend = async () => {
        try {
            const response = await api.post(`friends/friend`, { sid });
            if (!response.data.friend) {
                navigate('/chats');
            }
            setFriend(response.data.friend);
        } catch (error) {
            console.error('Error loading friend:', error);
            navigate('/chats');
        }
    }

    const loadMessages = async () => {
        try {
            setIsLoading(true);
            const response = await api.post('chat/history', { room: room.current });
            console.log(response.data);
            // Handle successful authentication
            if (response.data) {
                setMessages(response.data.history);
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        } finally {
            setIsLoading(false);
        }
    }

    const handleSend = () => {
        if (!newMessage.trim()) return;

        const socket = getSocket();
        socket.emit('sendMessage', {
            room: room.current,
            text: newMessage,
            to: sid
        });

        setNewMessage('');
    };


    const renderCallButtons = () => (
        <HStack spacing={2}>

            <IconButton
                icon={<FiPhone />}
                variant="ghost"
                aria-label="Voice call"
                onClick={() => {
                    console.log('Initiating call to:', sid);
                    callUser(sid);
                }}
            />

            <IconButton
                icon={<FiVideo />}
                variant="ghost"
                aria-label="Video call"
            />
            <IconButton
                icon={<FiMoreVertical />}
                variant="ghost"
                aria-label="More options"
            />
        </HStack>
    );

    const renderCallingAlert = () => {
        return (
            <>
                {/* Overlay */}
                <Box
                    position="fixed"
                    top={0}
                    left={0}
                    right={0}
                    bottom={0}
                    backgroundColor="rgba(0, 0, 0, 0.5)"
                    backdropFilter="blur(8px)"
                    zIndex={9}
                    onClick={(e) => e.preventDefault()}
                />

                {/* Calling Alert */}
                <Box
                    position="fixed"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%)"
                    zIndex={10}
                    width="350px"
                    bg="white"
                    borderRadius="xl"
                    boxShadow="2xl"
                    p={4}
                    textAlign="center"
                    backgroundImage={require('../images/ringBg.jpg')}
                    backgroundRepeat={'no-repeat'}
                    backgroundSize={'cover'}
                >
                    <VStack spacing={10}>
                        <Box
                            bg="blue.50"
                            p={3}
                            borderRadius="full"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                        >
                            <FiPhoneCall size={25} color="#3182ce" />
                        </Box>

                        <VStack spacing={2}>
                            <Text fontSize="xl" color="gray.700" fontWeight="bold">Calling</Text>
                            <Text fontSize="lg" color="gray.500">
                                {friend?.username || 'Contact'}
                            </Text>
                        </VStack>

                        <Text color="gray.400" fontStyle="italic">
                            Waiting for answer...
                        </Text>

                        <Button
                            colorScheme="red"
                            size="lg"
                            width="full"
                            onClick={() => {
                                console.log('Cancelling call');
                                endCall();
                            }}
                        >
                            Cancel Call
                        </Button>
                    </VStack>
                </Box>
            </>
        );
    };

    return (
        isLoading ? <Flex justify="center" align="center" h="100vh">Loading...</Flex> : <Flex
            direction="column"
            h="100vh"
            bg={bg}
            flex="1"
        >
            {callStarted && !callAccepted && renderCallingAlert()}
            {/* Chat Header */}
            <Box
                py={4}
                px={6}
                borderBottom="1px"
                borderColor={borderColor}
                bg={headerBg}
            >
                <Flex justify="space-between" align="center">
                    <HStack spacing={4}>
                        <IconButton
                            icon={<FiArrowLeft />}
                            variant="ghost"
                            onClick={() => navigate('/chats')}
                            aria-label="Back to chats"
                        />
                        <Avatar
                            size="md"
                            src={friend?.avatar}
                            name={friend?.username}
                        />
                        <Box>
                            <Text fontWeight="bold">{friend?.username}</Text>
                            <Text fontSize="sm" color={isOnline == 'online' ? "green.500" : "red.500"}>
                                {isOnline}
                            </Text>
                        </Box>
                    </HStack>
                    {renderCallButtons()}
                </Flex>
            </Box>

            {/* Messages Area */}
            <VStack
                flex="1"
                overflowY="auto"
                spacing={4}
                p={6}
                alignItems="stretch"
                bgImage="url('https://www.transparenttextures.com/patterns/inspiration-geometry.png')"
                bgColor={colorMode === "dark" ? "#1a202c" : "#ffffff"}
            >
                {
                    messages.map((message, index) => (
                        <Flex
                            key={index}
                            justify={message.sender === user.sid ? 'flex-end' : 'flex-start'}
                        >
                            <Box
                                maxW="70%"
                                bg={message.sender === user.sid ? userMessageBg : messageBg}
                                color={message.sender === user.sid ? 'white' : 'inherit'}
                                px={4}
                                py={2}
                                borderRadius="lg"
                            >
                                <Text>{message.content}</Text>
                                <Text
                                    fontSize="xs"
                                    opacity={0.8}
                                    mt={1}
                                >
                                    {moment(message.timestamp).format('HH:mm')}
                                </Text>
                            </Box>
                        </Flex>
                    ))
                }
                < div ref={messagesEndRef} />
            </VStack >

            {/* Message Input */}
            < Box p={4} borderTop="1px" borderColor={borderColor} bg={headerBg} >
                <Flex gap={3}>
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        bg={inputBg}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <Button
                        colorScheme="blue"
                        onClick={handleSend}
                        px={8}
                    >
                        Send
                    </Button>
                </Flex>
            </Box >
        </Flex >
    );
};

export default ChatRoom;