import axios from 'axios';

const api = axios.create({
    baseURL: 'https://chat-of3s.onrender.com/api'
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(undefined, (error) => {
    if (error.response.status === 401) {
        localStorage.clear();
        window.location.href = '/login';
    }
    return Promise.reject(error);
})

export default api;