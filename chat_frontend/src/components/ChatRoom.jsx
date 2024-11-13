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
    useBreakpointValue
} from '@chakra-ui/react';
import { FiArrowLeft, FiMoreVertical, FiPhone, FiVideo } from 'react-icons/fi';
import api from '../services/api';

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
    const isMobile = useBreakpointValue({ base: true, lg: false });

    // Color mode values
    const bg = useColorModeValue('white', 'gray.800');
    const headerBg = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const messageBg = useColorModeValue('gray.100', 'gray.700');
    const userMessageBg = useColorModeValue('blue.500', 'blue.600');
    const inputBg = useColorModeValue('white', 'gray.700');

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

    const scrollToBottom = (instant = false) => {
        messagesEndRef.current?.scrollIntoView({ behavior: instant ? 'instant' : 'smooth' });
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

    return (
        isLoading ? <Flex justify="center" align="center" h="100vh">Loading...</Flex> : <Flex
            direction="column"
            h="100vh"
            bg={bg}
            flex="1"
        >
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
                        {isMobile && (
                            <IconButton
                                icon={<FiArrowLeft />}
                                variant="ghost"
                                onClick={() => navigate('/chats')}
                                aria-label="Back to chats"
                            />
                        )}
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
                    <HStack spacing={2}>
                        <IconButton
                            icon={<FiPhone />}
                            variant="ghost"
                            aria-label="Voice call"
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
                </Flex>
            </Box>

            {/* Messages Area */}
            <VStack
                flex="1"
                overflowY="auto"
                spacing={4}
                p={6}
                alignItems="stretch"
            >
                {messages.map((message, index) => (
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
                ))}
                <div ref={messagesEndRef} />
            </VStack>

            {/* Message Input */}
            <Box p={4} borderTop="1px" borderColor={borderColor} bg={headerBg}>
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
            </Box>
        </Flex>
    );
};

export default ChatRoom;