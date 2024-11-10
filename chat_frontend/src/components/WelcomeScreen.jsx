import { Box, VStack, Text, Button, Flex, useColorModeValue } from '@chakra-ui/react';
import { FiMessageCircle, FiEdit } from 'react-icons/fi';

const WelcomeScreen = () => {
    const welcomeBg = useColorModeValue('gray.50', 'gray.900');
    const welcomeIconBg = useColorModeValue('blue.50', 'blue.900');
    const textColor = useColorModeValue('gray.800', 'white');
    const secondaryTextColor = useColorModeValue('gray.500', 'gray.400');

    return (
        <Flex
            flex="1"
            bg={welcomeBg}
            justify="center"
            align="center"
            h="full"
        >
            <VStack spacing={4}>
                <Box
                    bg={welcomeIconBg}
                    p={6}
                    borderRadius="full"
                >
                    <FiMessageCircle size="48px" color="var(--chakra-colors-blue-500)" />
                </Box>
                <Text fontSize="2xl" fontWeight="bold" color={textColor}>
                    Welcome to Chat App
                </Text>
                <Text color={secondaryTextColor} textAlign="center" maxW="md">
                    Select a conversation to start chatting.
                </Text>
            </VStack>
        </Flex>
    );
};

export default WelcomeScreen;