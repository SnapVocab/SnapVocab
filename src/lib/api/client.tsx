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

// Single flight: the backend rotates refresh tokens, so a second refresh with the same token
// fails and would sign the user out. Every 401 that arrives while one refresh runs waits for it.
let refreshing: Promise<string> | null = null;

function refreshAccessToken(refreshToken: string): Promise<string> {
  if (!refreshing) {
    refreshing = axios.post(`${Env.EXPO_PUBLIC_API_URL}/api/auth/refresh`, { refreshToken })
      .then(({ data }) => {
        const { access_token, refresh_token } = data.data;
        store.getState().updateTokens(access_token, refresh_token);
        return access_token as string;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

client.interceptors.response.use(
  response => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const { accessToken, refreshToken } = store.getState();
      // Sent with an access token another request already replaced: retry with the new one.
      if (accessToken && originalRequest.headers.Authorization !== `Bearer ${accessToken}`) {
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return client(originalRequest);
      }
      if (refreshToken) {
        try {
          originalRequest.headers.Authorization = `Bearer ${await refreshAccessToken(refreshToken)}`;
          return client(originalRequest);
        }
        catch {
          // Includes 403 USER_BANNED: a locked account gets no new tokens.
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
