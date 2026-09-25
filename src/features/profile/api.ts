import type { AxiosError } from 'axios';
import type { ApiResponse, ResponseLoginDTO, User } from '../auth/api';
import type { ChangePassword, UpdateProfile, UpdateUserSettings, UserSettings } from './types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { store as authStore, useAuthStore } from '@/features/auth/use-auth-store';
import { client } from '@/lib/api';
import { putFileToStorage } from '@/lib/storage/upload';

export const meKey = ['me'] as const;
export const settingsKey = ['user-settings'] as const;

/** The signed-in user, refreshed from the server (the stored copy goes stale). */
export function useMe() {
  const updateUser = useAuthStore(s => s.updateUser);

  return useQuery<User, AxiosError>({
    queryKey: meKey,
    queryFn: async () => {
      const response = await client<ApiResponse<User>>({ url: '/api/users/me', method: 'GET' });
      // Keep the persisted copy in step so screens that read the store agree.
      updateUser(response.data.data);
      return response.data.data;
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore(s => s.updateUser);

  return useMutation<User, AxiosError, UpdateProfile>({
    mutationFn: async (data) => {
      const response = await client<ApiResponse<User>>({ url: '/api/users/me', method: 'PUT', data });
      return response.data.data;
    },
    onSuccess: (user) => {
      updateUser(user);
      queryClient.setQueryData(meKey, user);
    },
  });
}

export function useUserSettings() {
  return useQuery<UserSettings, AxiosError>({
    queryKey: settingsKey,
    queryFn: async () => {
      const response = await client<ApiResponse<UserSettings>>({
        url: '/api/users/me/settings',
        method: 'GET',
      });
      return response.data.data;
    },
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation<UserSettings, AxiosError, UpdateUserSettings>({
    mutationFn: async (data) => {
      const response = await client<ApiResponse<UserSettings>>({
        url: '/api/users/me/settings',
        method: 'PUT',
        data,
      });
      return response.data.data;
    },
    // Write the server's answer straight in: the screen shows toggles, and a
    // refetch would make them flicker back to the old value first.
    onSuccess: settings => queryClient.setQueryData(settingsKey, settings),
  });
}

type PresignedUpload = {
  uploadUrl: string;
  objectName: string;
  contentType: string;
  expiredAt: number;
};

/**
 * Avatar upload (BF-04): ask for a presigned URL, PUT the file straight to
 * storage, then let the backend attach it to the account. The backend rejects
 * anything that is not an image of at most 5MB.
 */
export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError, { uri: string; fileName: string }>({
    mutationFn: async ({ uri, fileName }) => {
      const presigned = await client<ApiResponse<PresignedUpload>>({
        url: '/api/storage/upload-url',
        method: 'POST',
        data: { fileName },
      });
      const { uploadUrl, objectName, contentType } = presigned.data.data;

      await putFileToStorage(uploadUrl, uri, contentType);

      await client({
        url: '/api/storage/upload-complete',
        method: 'POST',
        data: { objectName, purpose: 'AVATAR' },
      });
    },
    // The avatar URL is signed per response, so re-read the profile rather
    // than reusing the URL returned by upload-complete.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: meKey }),
  });
}

/** Signs every other device out; this device gets a fresh token pair. */
export function useChangePassword() {
  const updateTokens = useAuthStore(s => s.updateTokens);

  return useMutation<ResponseLoginDTO, AxiosError, ChangePassword>({
    mutationFn: async (data) => {
      const response = await client<ApiResponse<ResponseLoginDTO>>({
        url: '/api/auth/change-password',
        method: 'POST',
        data,
      });
      return response.data.data;
    },
    onSuccess: tokens => updateTokens(tokens.access_token, tokens.refresh_token),
  });
}

/**
 * Revokes the refresh token on the server, then clears the local session.
 * The local part runs even when the call fails, so a device with no network
 * can still sign out.
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError, void>({
    mutationFn: async () => {
      const refreshToken = authStore.getState().refreshToken;
      if (!refreshToken)
        return;
      await client({ url: '/api/auth/logout', method: 'POST', data: { refreshToken } });
    },
    onSettled: () => {
      authStore.getState().logout();
      queryClient.clear();
    },
  });
}
