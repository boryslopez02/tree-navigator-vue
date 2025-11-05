import axios from 'axios';

const API_BASE_URL = 'https://api-graph.tests.grupoapok.com/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
});

// Manejo de errores global (opcional)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API error:', error);
        return Promise.reject(error);
    }
);

export default api;