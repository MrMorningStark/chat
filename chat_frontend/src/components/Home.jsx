import { useEffect, useState } from 'react';
import { Outlet, useLocation, useParams } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle, Avatar, Box, Button, ButtonGroup, Flex, HStack, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Text, useBreakpointValue, useToast, VStack } from '@chakra-ui/react';
import Chats from './Chats';
import { FaSearch, FaUserPlus } from 'react-icons/fa';
import api from '../services/api';
import { useWebRTC } from '../hooks/useWebRTC';
import { useSelector } from 'react-redux';
import { FiPhoneCall } from 'react-icons/fi';
import moment from 'moment';

const Home = () => {
    const { sid } = useParams();
    const toast = useToast();
    const isMobile = useBreakpointValue({ base: true, lg: false });
    // If we're on mobile and viewing a chat, hide the friends list
    const shouldShowFriendsList = !isMobile || !sid;

    // Modal state
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [refresh, setRefresh] = useState(false);

    const { user } = useSelector((state) => state.auth);

    const {
        callStarted,
        callAccepted,
        callEnded,
        stream,
        incomingCall,
        myAudio,
        userAudio,
        callDuration,
        callUser,
        answerCall,
        endCall
    } = useWebRTC(user.sid);

    const handleAddFriend = async (user) => {
        try {
            setIsSearchOpen(false);
            // Simulate API call
            await api.post('friends/add-friend', { friendId: user._id });
            // Handle successful authentication
            toast({
                title: "Friend Added",
                description: `You are now friends with ${user.username}`,
                status: "success",
                duration: 3000,
                isClosable: true,
            });
            setRefresh(!refresh);
        } catch (error) {
            console.log(error);
            toast({
                title: "Error",
                description: error.status === 400 ? error.response.data.message : "Something went wrong",
                status: "error",
                duration: 3000,
                isClosable: true,
            })
            console.error('Error searching for friends:', error);
        }
        finally {
            setSearchResults([]);
            setSearchQuery('');
        }
    };

    const handleSearch = async () => {
        try {
            setIsSearching(true);
            // Simulate API call
            const response = await api.post('friends/search', { query: searchQuery });
            console.log(response);
            // Handle successful authentication
            if (response.data.users) {
                setSearchResults(response.data.users);
            }
        } catch (error) {
            console.error('Error searching for friends:', error);
        }
        finally {
            setIsSearching(false);
        }
    };

    const renderCallAlert = () => {
        console.log('Rendering call alert:', { incomingCall, callAccepted });

        // If there's an active call or incoming call, render the overlay and alert
        if (callStarted || (incomingCall && !callAccepted)) {
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

                    {/* Call Alert */}
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
                        <VStack spacing={20}>
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
                                {callStarted ? (
                                    <>
                                        <Text fontSize="xl" color="gray.100" fontWeight="bold">Call in Progress</Text>
                                        <Text fontSize="2xl" fontWeight="semibold" color="gray.100">
                                            {`${moment.utc(callDuration).format('HH:mm:ss')}`}
                                        </Text>
                                    </>
                                ) : (
                                    <>
                                        <Text fontSize="xl" color="gray.100" fontWeight="bold">Incoming Call</Text>
                                        <Text color="gray.500">
                                            {incomingCall?.from || 'Unknown Caller'}
                                        </Text>
                                    </>
                                )}
                            </VStack>

                            <HStack spacing={4} width="full" justifyContent="center">
                                {callStarted ? (
                                    <Button
                                        colorScheme="red"
                                        size="lg"
                                        width="full"
                                        onClick={() => {
                                            console.log('Ending call');
                                            endCall();
                                        }}
                                        opacity={0.95}
                                        boxShadow={'0 4px 6px rgba(0, 0, 0, 1)'} paddingX={2} borderRadius={'full'}
                                    >
                                        End Call
                                    </Button>
                                ) : (
                                    <>
                                        <Button
                                            colorScheme="green"
                                            size="lg"
                                            width="full"
                                            onClick={() => {
                                                console.log('Answering call from:', incomingCall.from);
                                                answerCall();
                                            }}
                                            opacity={0.95}
                                            boxShadow={'0 4px 6px rgba(0, 0, 0, 1)'} paddingX={2} borderRadius={'full'}
                                        >
                                            Answer
                                        </Button>
                                        <Button
                                            colorScheme="red"
                                            size="lg"
                                            width="full"
                                            onClick={() => {
                                                console.log('Declining call');
                                                endCall();
                                            }}
                                            opacity={0.95}
                                            boxShadow={'0 4px 6px rgba(0, 0, 0, 1)'} paddingX={2} borderRadius={'full'}
                                        >
                                            Decline
                                        </Button>
                                    </>
                                )}
                            </HStack>
                        </VStack>
                    </Box>
                </>
            );
        }

        // Return null if no active call or incoming call
        return null;
    };

    return (
        <Flex h="100vh">
            <audio ref={myAudio} autoPlay muted onLoadedMetadata={() => console.log('Local audio ready')} />
            <audio ref={userAudio} autoPlay onLoadedMetadata={() => console.log('Remote audio ready')} />
            {renderCallAlert()}
            {/* Friends List - hidden on mobile when viewing a chat */}
            {shouldShowFriendsList && (
                <Box
                    w={{ base: "full", lg: "400px" }}
                    borderRight="1px"
                    borderColor="gray.200"
                >
                    <Chats refresh={refresh} setIsSearchOpen={setIsSearchOpen} />
                </Box>
            )}

            {/* Chat Area or Welcome Screen */}
            {(!isMobile || (isMobile && sid)) && (
                <Box flex="1">
                    <Outlet />
                </Box>
            )}
            {/* Search Modal */}
            <Modal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Find New Friends</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        <VStack spacing="4">
                            <HStack w="full">
                                <Input
                                    placeholder="Search by name or username"
                                    value={searchQuery}
                                    onKeyUp={(e) => { if (e.key == 'Enter') handleSearch() }}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <Button
                                    onClick={handleSearch}
                                    isLoading={isSearching}
                                >
                                    Search
                                </Button>
                            </HStack>

                            {searchResults.map((user) => (
                                <Flex
                                    key={user.id}
                                    w="full"
                                    justify="space-between"
                                    align="center"
                                    p="3"
                                    borderRadius="md"
                                    border="1px"
                                    borderColor="gray.200"
                                >
                                    <Flex>
                                        <Avatar name={user.name} src={user.avatar} mr={"1"} />
                                        <Box>
                                            <Text fontWeight="bold">{user.username}</Text>
                                            <Text color="gray.500">{user.email}</Text>
                                        </Box>
                                    </Flex>
                                    <Button
                                        size="sm"
                                        leftIcon={<FaUserPlus className="w-4 h-4" />}
                                        onClick={() => handleAddFriend(user)}
                                    >
                                        Add Friend
                                    </Button>
                                </Flex>
                            ))}
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Flex>
    );
};

export default Home;