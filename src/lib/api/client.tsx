import axios from 'axios';
import Env from 'env';
import { store } from '@/features/auth/use-auth-store';
import { RENDERED_TRIGGERS } from '@/features/missions/types';

export const client = axios.create({
  baseURL: Env.EXPO_PUBLIC_API_URL,
  timeout: 15000,
  // Any request can assign today's missions (the first action of the day), so every request says what it can show.
  headers: { 'X-Mission-Triggers': RENDERED_TRIGGERS.join(',') },
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
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
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
