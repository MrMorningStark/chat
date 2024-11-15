import {
    Box,
    Button,
    FormControl,
    FormLabel,
    Input,
    VStack,
    Text,
    useToast,
    Container,
    Divider,
    HStack,
    Icon,
    useColorModeValue,
    Center,
    Switch,
    FormErrorMessage,
    InputGroup,
    InputRightElement,
    IconButton,
    useColorMode,
} from '@chakra-ui/react';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setCredentials } from '../redux/authSlice';
import { FaGoogle, FaEye, FaEyeSlash } from 'react-icons/fa';
import api from '../services/api';
import { FiMoon, FiSun } from 'react-icons/fi';
import { motion } from 'framer-motion';

const AuthForm = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const toast = useToast();

    const { colorMode, toggleColorMode } = useColorMode();

    // Chakra UI color modes
    const bgColor = useColorModeValue('white', 'gray.700');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    const validateForm = () => {
        const newErrors = {};
        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (!isLogin) {
            if (!formData.name) {
                newErrors.name = 'Name is required';
            }
            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Passwords do not match';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsLoading(true);
        try {
            const endpoint = isLogin ? '/auth/login' : '/auth/register';
            const payload = isLogin
                ? {
                    email: formData.email,
                    password: formData.password
                }
                : {
                    username: formData.name,
                    email: formData.email,
                    password: formData.password
                };

            const response = await api.post(endpoint, payload);
            console.log(response);
            // Handle successful authentication
            if (response.data.token) {
                dispatch(setCredentials({
                    user: response.data.user,
                    token: response.data.token
                }));
            }

            toast({
                title: isLogin ? 'Login Successful' : 'Registration Successful',
                description: isLogin ? 'Welcome back!' : 'Your account has been created successfully',
                status: 'success',
                duration: 2000,
                isClosable: true,
            });

            navigate('/chats');
        } catch (error) {
            const errorMessage = error.response?.data?.error || 'Something went wrong';
            toast({
                title: isLogin ? 'Login Failed' : 'Registration Failed',
                description: errorMessage,
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSocialAuth = async (provider) => {
        try {
            toast({
                title: 'Not Implemented',
                description: `${provider} authentication is not yet implemented`,
                status: 'info',
                duration: 3000,
                isClosable: true,
            });
        } catch (error) {
            toast({
                title: 'Authentication Failed',
                description: `Failed to authenticate with ${provider}`,
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    return (
        <Box
            minH="100vh"
            bg={useColorModeValue('gray.50', 'gray.800')}
            py={12}
            px={4}
        >
            <Container maxW="md">
                <Box
                    bg={bgColor}
                    p={8}
                    borderRadius="xl"
                    boxShadow="lg"
                    border="1px"
                    borderColor={borderColor}
                    position="relative"
                >
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1 }}
                        onClick={toggleColorMode}
                    >
                        <IconButton
                            variant="ghost"
                            icon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
                            color={colorMode === 'light' ? 'gray.500' : 'yellow.500'}
                            aria-label={colorMode === 'light' ? 'Dark Mode' : 'Light Mode'}
                            title={colorMode === 'light' ? 'Dark Mode' : 'Light Mode'}
                            size="lg"
                            position="absolute"
                            top={2}
                            right={2}
                        />
                    </motion.span>
                    <VStack spacing={8}>
                        {/* Header */}
                        <VStack spacing={2} w="full">
                            <Text fontSize="3xl" fontWeight="bold">
                                {isLogin ? 'Welcome Back' : 'Create Account'}
                            </Text>
                            <Text color="gray.500" fontSize="md">
                                {isLogin ? 'Sign in to your account' : 'Sign up for a new account'}
                            </Text>
                        </VStack>

                        {/* Social Auth Buttons */}
                        <VStack spacing={4} w="full">
                            <HStack spacing={4} w="full">
                                <Button
                                    w="full"
                                    variant="outline"
                                    leftIcon={<Icon as={FaGoogle} />}
                                    onClick={() => handleSocialAuth('google')}
                                >
                                    Google
                                </Button>
                            </HStack>

                            <HStack w="full">
                                <Divider />
                                <Text fontSize="sm" color="gray.500" whiteSpace="nowrap">
                                    or continue with email
                                </Text>
                                <Divider />
                            </HStack>
                        </VStack>

                        {/* Auth Form */}
                        <VStack as="form" spacing={4} w="full" onSubmit={handleSubmit}>
                            {!isLogin && (
                                <FormControl isInvalid={errors.name}>
                                    <FormLabel>Full Name</FormLabel>
                                    <Input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Enter your full name"
                                        size="lg"
                                    />
                                    <FormErrorMessage>{errors.name}</FormErrorMessage>
                                </FormControl>
                            )}

                            <FormControl isInvalid={errors.email}>
                                <FormLabel>Email</FormLabel>
                                <Input
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="name@example.com"
                                    size="lg"
                                />
                                <FormErrorMessage>{errors.email}</FormErrorMessage>
                            </FormControl>

                            <FormControl isInvalid={errors.password}>
                                <FormLabel>Password</FormLabel>
                                <InputGroup size="lg">
                                    <Input
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Enter your password"
                                    />
                                    <InputRightElement>
                                        <IconButton
                                            variant="ghost"
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                            icon={showPassword ? <FaEyeSlash /> : <FaEye />}
                                            onClick={() => setShowPassword(!showPassword)}
                                        />
                                    </InputRightElement>
                                </InputGroup>
                                <FormErrorMessage>{errors.password}</FormErrorMessage>
                            </FormControl>

                            {!isLogin && (
                                <FormControl isInvalid={errors.confirmPassword}>
                                    <FormLabel>Confirm Password</FormLabel>
                                    <InputGroup size="lg">
                                        <Input
                                            name="confirmPassword"
                                            type={showPassword ? "text" : "password"}
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            placeholder="Confirm your password"
                                        />
                                    </InputGroup>
                                    <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
                                </FormControl>
                            )}

                            <Button
                                type="submit"
                                colorScheme="blue"
                                size="lg"
                                width="full"
                                isLoading={isLoading}
                                loadingText={isLogin ? "Signing in..." : "Creating account..."}
                                mt={2}
                            >
                                {isLogin ? 'Sign In' : 'Create Account'}
                            </Button>
                        </VStack>

                        {/* Footer */}
                        <Center w="full" pt={4}>
                            <Text fontSize="sm" color="gray.500">
                                {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                                <Button
                                    variant="link"
                                    colorScheme="blue"
                                    onClick={() => {
                                        setIsLogin(!isLogin);
                                        setErrors({});
                                        setFormData({
                                            email: '',
                                            password: '',
                                            confirmPassword: '',
                                            name: '',
                                        });
                                    }}
                                    fontSize="sm"
                                >
                                    {isLogin ? 'Sign up' : 'Sign in'}
                                </Button>
                            </Text>
                        </Center>
                    </VStack>
                </Box>
            </Container>
        </Box>
    );
};

export default AuthForm;