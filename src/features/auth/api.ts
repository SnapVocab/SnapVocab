import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';
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

// mutations
export const useLogin = createMutation<ResponseLoginDTO, RequestLoginDTO, AxiosError>({
  mutationFn: async variables =>
    client<ApiResponse<ResponseLoginDTO>>({
      url: '/api/auth/login',
      method: 'POST',
      data: variables,
    }).then((response) => {
      return response.data.data;
    }),
});

export const useRegister = createMutation<ResponseRegisterDTO, RequestRegisterDTO, AxiosError>({
  mutationFn: async variables =>
    client<ApiResponse<ResponseRegisterDTO>>({
      url: '/api/auth/register',
      method: 'POST',
      data: variables,
    }).then(response => response.data.data),
});

export const useVerifyCode = createMutation<ResponseLoginDTO, VerifyMailRequest, AxiosError>({
  mutationFn: async variables =>
    client<ApiResponse<ResponseLoginDTO>>({
      url: '/api/auth/verify',
      method: 'POST',
      data: variables,
    }).then(response => response.data.data),
});

export const useResendCode = createMutation<object, ResendCodeRequest, AxiosError>({
  mutationFn: async variables =>
    client<ApiResponse<object>>({
      url: '/api/auth/resend-code',
      method: 'POST',
      data: variables,
    }).then(response => response.data.data),
});

export const useForgotPassword = createMutation<object, ForgotPasswordRequest, AxiosError>({
  mutationFn: async variables =>
    client<ApiResponse<object>>({
      url: '/api/auth/forgot-password',
      method: 'POST',
      data: variables,
    }).then(response => response.data.data),
});

export const useResetPassword = createMutation<object, ResetPasswordRequest, AxiosError>({
  mutationFn: async variables =>
    client<ApiResponse<object>>({
      url: '/api/auth/reset-password',
      method: 'POST',
      data: variables,
    }).then(response => response.data.data),
});

export const useRefreshToken = createMutation<ResponseLoginDTO, RefreshTokenRequest, AxiosError>({
  mutationFn: async variables =>
    client<ApiResponse<ResponseLoginDTO>>({
      url: '/api/auth/refresh',
      method: 'POST',
      data: variables,
    }).then(response => response.data.data),
});
