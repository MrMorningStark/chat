import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    Box,
    Flex,
    Input,
    InputGroup,
    InputLeftElement,
    Avatar,
    Text,
    IconButton,
    useColorModeValue,
    VStack,
    HStack,
    Badge,
    Divider,
    useBreakpointValue,
    Skeleton,
} from '@chakra-ui/react';
import {
    FiSearch,
    FiSettings,
    FiEdit,
    FiMessageCircle,
    FiUsers,
    FiPhone,
} from 'react-icons/fi';
import api from '../services/api';
import { connectSocket } from '../services/socket';

const Chats = ({ refresh }) => {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const [searchQuery, setSearchQuery] = useState('');

    // Color mode values
    const bg = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const hoverBg = useColorModeValue('gray.50', 'gray.700');
    const textColor = useColorModeValue('gray.800', 'white');
    const secondaryTextColor = useColorModeValue('gray.500', 'gray.400');

    // Responsive values
    const sidebarWidth = useBreakpointValue({ base: 'full', lg: '400px' });

    const [loading, setLoading] = useState(false);
    const [friends, setFriends] = useState([
        // {
        //     id: 1,
        //     username: 'John Doe',
        //     avatar: '/api/placeholder/150/150',
        //     lastMessage: 'Hey, how are you?',
        //     lastMessageTime: '10:30 AM',
        //     status: 'online',
        //     unreadCount: 3,
        //     isTyping: true
        // },
        // {
        //     id: 2,
        //     username: 'Design Team',
        //     avatar: '/api/placeholder/150/150',
        //     lastMessage: 'Mike: Latest design updates are ready',
        //     lastMessageTime: 'Yesterday',
        //     status: 'offline',
        //     unreadCount: 12,
        //     isGroup: true,
        //     members: 8
        // },
        // {
        //     id: 3,
        //     username: 'Jane Smith',
        //     avatar: '/api/placeholder/150/150',
        //     lastMessage: 'Just sent you the files you asked for!',
        //     lastMessageTime: '2 days ago',
        //     status: 'online',
        //     unreadCount: 0
        // },
        // {
        //     id: 4,
        //     username: 'Marketing Group',
        //     avatar: '/api/placeholder/150/150',
        //     lastMessage: 'Sarah: Updated campaign metrics...',
        //     lastMessageTime: '3 days ago',
        //     status: 'online',
        //     unreadCount: 5,
        //     isGroup: true,
        //     members: 12
        // },

    ]);

    useEffect(() => {
        connectSocket(user.sid);
        loadFriends();
    }, [refresh]);

    const loadFriends = async () => {
        try {
            setLoading(true);
            const response = await api.get('friends/list');
            setFriends(response.data.friends);
        } catch (error) {
            console.error('Error loading friends:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredFriends = friends.filter(friend =>
        friend.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Mobile navigation items
    const navItems = [
        { icon: FiMessageCircle, label: 'Chats', value: 'chats' },
        { icon: FiUsers, label: 'People', value: 'people' },
        { icon: FiPhone, label: 'Calls', value: 'calls' },
        { icon: FiSettings, label: 'Settings', value: 'settings' },
    ];

    return (
        <Box h="100vh" bg={bg} pt={"65px"}>
            <Flex h="full">
                {/* Sidebar */}
                <Box
                    w={sidebarWidth}
                    borderRight="1px"
                    borderColor={borderColor}
                    h="full"
                    overflow="hidden"
                    display="flex"
                    flexDirection="column"
                >
                    {/* Header */}
                    <Box p={4} borderBottom="1px" borderColor={borderColor}>
                        <Flex justify="space-between" align="center" mb={4}>
                            <HStack spacing={3}>
                                <Avatar size="sm" src={user.avatar} name={user.username} title={user.username} />
                                <Text fontSize="xl" fontWeight="bold" color={textColor}>
                                    Messages
                                </Text>
                            </HStack>
                            <HStack spacing={2}>
                                <IconButton
                                    variant="ghost"
                                    icon={<FiEdit />}
                                    aria-label="New Message"
                                    size="sm"
                                />
                                <IconButton
                                    variant="ghost"
                                    icon={<FiSettings />}
                                    aria-label="Settings"
                                    size="sm"
                                />
                            </HStack>
                        </Flex>
                        <InputGroup>
                            <InputLeftElement pointerEvents="none">
                                <FiSearch color="gray.400" />
                            </InputLeftElement>
                            <Input
                                placeholder="Search messages"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                variant="filled"
                            />
                        </InputGroup>
                    </Box>

                    {/* Chat List */}
                    <VStack
                        flex="1"
                        overflowY="auto"
                        spacing={0}
                        divider={<Divider borderColor={borderColor}
                        />}
                    >
                        {loading
                            ?
                            <Box p={4} width={"100%"}>
                                <Skeleton height="70px" my={2} borderRadius={"md"} />
                                <Skeleton height="70px" my={2} borderRadius={"md"} />
                                <Skeleton height="70px" my={2} borderRadius={"md"} />
                                <Skeleton height="70px" my={2} borderRadius={"md"} />
                                <Skeleton height="70px" my={2} borderRadius={"md"} />
                                <Skeleton height="70px" my={2} borderRadius={"md"} />
                                <Skeleton height="70px" my={2} borderRadius={"md"} />
                                <Skeleton height="70px" my={2} borderRadius={"md"} />
                                <Skeleton height="70px" my={2} borderRadius={"md"} />
                                <Skeleton height="70px" my={2} borderRadius={"md"} />
                                <Skeleton height="70px" my={2} borderRadius={"md"} />
                                <Skeleton height="70px" my={2} borderRadius={"md"} />
                            </Box>
                            : filteredFriends.map((friend) => (
                                <Box
                                    key={friend.sid}
                                    w="full"
                                    px={4}
                                    py={3}
                                    cursor="pointer"
                                    onClick={() => navigate(`/chats/${friend.sid}`)}
                                    _hover={{ bg: hoverBg }}
                                    transition="background 0.2s"
                                >
                                    <HStack spacing={3}>
                                        <Box position="relative">
                                            <Avatar size="md" src={friend.avatar} name={friend.username} title={friend.username} />
                                            {friend.status === 'online' && (
                                                <Box
                                                    position="absolute"
                                                    bottom="2px"
                                                    right="2px"
                                                    w="3"
                                                    h="3"
                                                    bg="green.500"
                                                    borderRadius="full"
                                                    border="2px"
                                                    borderColor={bg}
                                                />
                                            )}
                                        </Box>
                                        <Box flex="1" minW="0">
                                            <Flex justify="space-between" align="center">
                                                <HStack>
                                                    <Text fontWeight="semibold" color={textColor}>
                                                        {friend.username}
                                                    </Text>
                                                    {/* {friend.isGroup && (
                                                        <Text fontSize="xs" color={secondaryTextColor}>
                                                            · {friend.members} members
                                                        </Text>
                                                    )} */}
                                                </HStack>
                                                <Text fontSize="xs" color={secondaryTextColor}>
                                                    {/* {friend.lastMessageTime} */}
                                                </Text>
                                            </Flex>
                                            <Flex justify="space-between" align="center">
                                                {/* <Text
                                                    fontSize="sm"
                                                    color={friend.isTyping ? 'blue.500' : secondaryTextColor}
                                                    noOfLines={1}
                                                >
                                                    {friend.isTyping ? 'typing...' : friend.lastMessage}
                                                </Text> */}
                                                {/* {friend.unreadCount > 0 && (
                                                    <Badge
                                                        colorScheme="blue"
                                                        borderRadius="full"
                                                        px={2}
                                                        ml={2}
                                                    >
                                                        {friend.unreadCount}
                                                    </Badge>
                                                )} */}
                                            </Flex>
                                        </Box>
                                    </HStack>
                                </Box>
                            ))}
                    </VStack>
                </Box>
            </Flex>
        </Box>
    );
};

export default Chats;