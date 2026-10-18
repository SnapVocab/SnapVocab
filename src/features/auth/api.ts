import type { AxiosError } from 'axios';
import type { User as StoredUser } from './use-auth-store';
import { useMutation } from '@tanstack/react-query';
import { client } from '@/lib/api';

export type ApiResponse<T> = {
  statusCode: number;
  data: T;
  error: string | null;
};

export type User = {
  id: number;
  nativeLanguage: string;
  learningLanguage: string;
  avatarUrl: string;
  exp: number;
  coin: number;
  streakDays: number;
  lastStudiedAt: string;
  email: string;
  firstName: string;
  lastName: string;
  bio: string;
  createdAt?: string;
  equipped?: StoredUser['equipped'];
  activeBooster?: StoredUser['activeBooster'];
};

// login
export type RequestLoginDTO = {
  email: string;
  password: string;
};

export type ResponseLoginDTO = {
  access_token: string;
  refresh_token: string;
  user: User;
};

// register
export type RequestRegisterDTO = {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
};

export type ResponseRegisterDTO = {
  lastName: string;
  firstName: string;
  email: string;
  exp: number;
  coin: number;
  streakDays: number;
  activated: boolean;
};

// verify
export type VerifyMailRequest = {
  email: string;
  code: string;
};

// forgot password
export type ForgotPasswordRequest = {
  email: string;
};

// reset password
export type ResetPasswordRequest = {
  email: string;
  code: string;
  newPassword: string;
};

// resend code
export type ResendCodeRequest = {
  email: string;
};

// refresh token
export type RefreshTokenRequest = {
  refreshToken: string;
};

// custom mutation hooks
export function useLogin() {
  return useMutation<ResponseLoginDTO, AxiosError, RequestLoginDTO>({
    mutationFn: async (variables) => {
      const response = await client<ApiResponse<ResponseLoginDTO>>({
        url: '/api/auth/login',
        method: 'POST',
        data: variables,
      });
      return response.data.data;
    },
  });
}

export function useRegister() {
  return useMutation<ResponseRegisterDTO, AxiosError, RequestRegisterDTO>({
    mutationFn: async (variables) => {
      const response = await client<ApiResponse<ResponseRegisterDTO>>({
        url: '/api/auth/register',
        method: 'POST',
        data: variables,
      });
      return response.data.data;
    },
  });
}

export function useVerifyCode() {
  return useMutation<ResponseLoginDTO, AxiosError, VerifyMailRequest>({
    mutationFn: async (variables) => {
      const response = await client<ApiResponse<ResponseLoginDTO>>({
        url: '/api/auth/verify',
        method: 'POST',
        data: variables,
      });
      return response.data.data;
    },
  });
}

export function useResendCode() {
  return useMutation<object, AxiosError, ResendCodeRequest>({
    mutationFn: async (variables) => {
      const response = await client<ApiResponse<object>>({
        url: '/api/auth/resend-code',
        method: 'POST',
        data: variables,
      });
      return response.data.data;
    },
  });
}

export function useForgotPassword() {
  return useMutation<object, AxiosError, ForgotPasswordRequest>({
    mutationFn: async (variables) => {
      const response = await client<ApiResponse<object>>({
        url: '/api/auth/forgot-password',
        method: 'POST',
        data: variables,
      });
      return response.data.data;
    },
  });
}

export function useResetPassword() {
  return useMutation<object, AxiosError, ResetPasswordRequest>({
    mutationFn: async (variables) => {
      const response = await client<ApiResponse<object>>({
        url: '/api/auth/reset-password',
        method: 'POST',
        data: variables,
      });
      return response.data.data;
    },
  });
}

export function useRefreshToken() {
  return useMutation<ResponseLoginDTO, AxiosError, RefreshTokenRequest>({
    mutationFn: async (variables) => {
      const response = await client<ApiResponse<ResponseLoginDTO>>({
        url: '/api/auth/refresh',
        method: 'POST',
        data: variables,
      });
      return response.data.data;
    },
  });
}
