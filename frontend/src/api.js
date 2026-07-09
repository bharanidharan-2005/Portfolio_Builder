import axios from 'axios';

const API = axios.create({
    baseURL: 'https://aurabuild-backend.onrender.com/api/',
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json',
    }
});

export default API;