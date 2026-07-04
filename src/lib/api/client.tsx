import axios from 'axios';
import Env from 'env';
import { store } from '@/features/auth/use-auth-store';

export const client = axios.create({
  baseURL: Env.EXPO_PUBLIC_API_URL,
  timeout: 15000,
});

client.interceptors.request.use((config) => {
  const token = store.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  response => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = store.getState().refreshToken;
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${Env.EXPO_PUBLIC_API_URL}/api/auth/refresh`, {
            refreshToken,
          });
          const { access_token, refresh_token } = data.data;
          store.getState().updateTokens(access_token, refresh_token);
          originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
          return client(originalRequest);
        }
        catch {
          store.getState().logout();
        }
      }
      else {
        store.getState().logout();
      }
    }
    return Promise.reject(error);
  },
);
