import { useEffect, useState } from 'react';
import { Outlet, useLocation, useParams } from 'react-router-dom';
import { Avatar, Box, Button, Flex, HStack, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Text, useBreakpointValue, useToast, VStack } from '@chakra-ui/react';
import Chats from './Chats';
import { FaSearch, FaUserPlus } from 'react-icons/fa';
import api from '../services/api';

const ChatLayout = () => {
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
            toast({
                title: "Error",
                description: "Failed to add friend",
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

    return (
        <Flex h="100vh">
            {/* Friends List - hidden on mobile when viewing a chat */}
            {shouldShowFriendsList && (
                <Box
                    w={{ base: "full", lg: "400px" }}
                    borderRight="1px"
                    borderColor="gray.200"
                    position={"relative"}
                >
                    <Flex position={'absolute'} top={0} w={"full"} p="4" borderBottom="1px" borderColor="gray.200" >
                        <Button
                            leftIcon={<FaSearch className="w-4 h-4" />}
                            onClick={() => setIsSearchOpen(true)}
                            variant="outline"
                            w="full"
                        >
                            Find New Friends
                        </Button>
                    </Flex>
                    <Chats refresh={refresh} />
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

export default ChatLayout;