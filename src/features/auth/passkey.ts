import type { AxiosError } from 'axios';
import type { PasskeyCreateRequest, PasskeyGetRequest } from 'react-native-passkey';
import type { ApiResponse, ResponseLoginDTO } from './api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { Passkey } from 'react-native-passkey';
import { client } from '@/lib/api';
import { storage } from '@/lib/storage';

const LAST_EMAIL_KEY = 'passkey_last_email';
const DEVICE_PASSKEY_KEY = 'passkey_device_binding';

export type StoredPasskeyBinding = {
  dbId: number;
  credentialId: string;
  email: string;
};

export type WebAuthnCredentialDTO = {
  id: number;
  credentialId: string;
  deviceName: string | null;
  transports: string[];
  backupEligible: boolean;
  backupState: boolean;
  createdAt: string | null;
  lastUsedAt: string | null;
};

type WebAuthnLoginOptionsResponse = {
  challengeId: string;
  publicKey: PasskeyGetRequest;
};

export const PASSKEY_CREDENTIALS_QUERY_KEY = ['auth', 'webauthn', 'credentials'] as const;

export function isPasskeySupported(): boolean {
  try {
    return Passkey.isSupported();
  }
  catch {
    return false;
  }
}

export function getLastLoginEmail(): string {
  return storage.getString(LAST_EMAIL_KEY) ?? '';
}

export function setLastLoginEmail(email: string): void {
  const trimmed = email.trim();
  if (trimmed) {
    storage.set(LAST_EMAIL_KEY, trimmed);
  }
}

export function getStoredPasskeyBinding(): StoredPasskeyBinding | null {
  const raw = storage.getString(DEVICE_PASSKEY_KEY);
  if (!raw)
    return null;
  try {
    const parsed = JSON.parse(raw) as Partial<StoredPasskeyBinding>;
    if (typeof parsed.dbId === 'number' && typeof parsed.credentialId === 'string' && typeof parsed.email === 'string') {
      return parsed as StoredPasskeyBinding;
    }
    return null;
  }
  catch {
    return null;
  }
}

export function setStoredPasskeyBinding(binding: StoredPasskeyBinding): void {
  storage.set(DEVICE_PASSKEY_KEY, JSON.stringify(binding));
}

export function clearStoredPasskeyBinding(): void {
  storage.remove(DEVICE_PASSKEY_KEY);
}

/** True when the user dismissed the OS biometric prompt rather than hitting a real error. */
export function isPasskeyCancelledError(error: unknown): boolean {
  if (!error || typeof error !== 'object')
    return false;
  const err = error as { error?: string; code?: string; message?: string };
  const token = `${err.error ?? ''} ${err.code ?? ''} ${err.message ?? ''}`.toLowerCase();
  return token.includes('cancel') || token.includes('interrupted');
}

function buildDeviceName(): string {
  const name = Device.deviceName || Device.modelName;
  if (name && name.trim().length > 0) {
    return name.trim().slice(0, 120);
  }
  return Platform.OS === 'ios' ? 'iOS Device' : 'Android Device';
}

export function usePasskeyCredentials(enabled = true) {
  return useQuery<WebAuthnCredentialDTO[], AxiosError>({
    queryKey: PASSKEY_CREDENTIALS_QUERY_KEY,
    enabled,
    queryFn: async () => {
      const response = await client<ApiResponse<WebAuthnCredentialDTO[]>>({
        url: '/api/auth/webauthn/credentials',
        method: 'GET',
      });
      return response.data.data ?? [];
    },
  });
}

export function useRegisterPasskey() {
  const queryClient = useQueryClient();

  return useMutation<WebAuthnCredentialDTO, unknown, { email: string }>({
    mutationFn: async ({ email }) => {
      const optionsRes = await client<ApiResponse<PasskeyCreateRequest>>({
        url: '/api/auth/webauthn/register/options',
        method: 'POST',
      });
      const options = optionsRes.data.data;

      const credential = await Passkey.create(options);

      const verifyRes = await client<ApiResponse<WebAuthnCredentialDTO>>({
        url: '/api/auth/webauthn/register/verify',
        method: 'POST',
        data: {
          id: credential.id,
          response: {
            clientDataJSON: credential.response.clientDataJSON,
            attestationObject: credential.response.attestationObject,
            transports: credential.response.transports,
          },
          deviceName: buildDeviceName(),
        },
      });

      const saved = verifyRes.data.data;
      setStoredPasskeyBinding({
        dbId: saved.id,
        credentialId: saved.credentialId,
        email: email.trim().toLowerCase(),
      });
      setLastLoginEmail(email);
      return saved;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PASSKEY_CREDENTIALS_QUERY_KEY });
    },
  });
}

export function useDisablePasskey() {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError, { dbId: number }>({
    mutationFn: async ({ dbId }) => {
      await client({
        url: `/api/auth/webauthn/credentials/${dbId}`,
        method: 'DELETE',
      });
      clearStoredPasskeyBinding();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PASSKEY_CREDENTIALS_QUERY_KEY });
    },
  });
}

export function usePasskeyLogin() {
  return useMutation<ResponseLoginDTO, unknown, { email?: string } | undefined>({
    mutationFn: async (variables) => {
      const email = variables?.email?.trim() || getLastLoginEmail() || undefined;
      const optionsRes = await client<ApiResponse<WebAuthnLoginOptionsResponse>>({
        url: '/api/auth/webauthn/login/options',
        method: 'POST',
        data: email ? { email } : {},
      });
      const { challengeId, publicKey } = optionsRes.data.data;

      const assertion = await Passkey.get(publicKey);

      const verifyRes = await client<ApiResponse<ResponseLoginDTO>>({
        url: '/api/auth/webauthn/login/verify',
        method: 'POST',
        data: {
          challengeId,
          id: assertion.id,
          response: {
            clientDataJSON: assertion.response.clientDataJSON,
            authenticatorData: assertion.response.authenticatorData,
            signature: assertion.response.signature,
            userHandle: assertion.response.userHandle,
          },
        },
      });

      const loginData = verifyRes.data.data;
      if (loginData.user?.email) {
        setLastLoginEmail(loginData.user.email);
      }
      return loginData;
    },
  });
}
