import axios from 'axios';

// Configure test API instance
export const testApi = axios.create({
    baseURL: 'http://localhost:6061',
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Export the base configuration
export const apiConfig = {
    baseURL: 'http://localhost:6061',
    timeout: 5000
};