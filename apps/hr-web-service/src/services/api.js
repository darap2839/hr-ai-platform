import axios from 'axios';
import { API_URL } from '../constants/api'; // из констант

const api = axios.create({
  baseURL: API_URL,
});

//const API_URL = 'http://127.0.0.1:8000';

export const authService = {
  // Метод для входа
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  }
};

export const resumeService = {
  // Метод для загрузки резюме на анализ
  uploadResume: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/resumes/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
};

export default api;