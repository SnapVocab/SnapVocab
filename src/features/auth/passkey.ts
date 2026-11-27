import type { AxiosError } from 'axios';
import type { ApiResponse, ResponseLoginDTO } from './api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Device from 'expo-device';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { client } from '@/lib/api';
import { translate } from '@/lib/i18n';
import { storage } from '@/lib/storage';

const LAST_EMAIL_KEY = 'passkey_last_email';
const DEVICE_PASSKEY_KEY = 'passkey_device_binding';
const BIOMETRIC_TOKEN_KEY = 'snapvocab_biometric_token';

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

type BiometricRegisterResponse = {
  id: number;
  credentialId: string;
  biometricToken: string;
  deviceName: string | null;
  createdAt: string | null;
};

export const PASSKEY_CREDENTIALS_QUERY_KEY = ['auth', 'webauthn', 'credentials'] as const;

export function isPasskeySupported(): boolean {
  return Platform.OS === 'android' || Platform.OS === 'ios';
}

/** Checks asynchronously whether the device has enrolled biometric hardware (fingerprint / Face ID). */
export function useBiometricSupported(): boolean {
  const [supported, setSupported] = useState(() => isPasskeySupported());

  useEffect(() => {
    if (!isPasskeySupported())
      return;
    let active = true;
    void (async () => {
      try {
        const [hasHardware, isEnrolled] = await Promise.all([
          LocalAuthentication.hasHardwareAsync(),
          LocalAuthentication.isEnrolledAsync(),
        ]);
        if (active)
          setSupported(hasHardware && isEnrolled);
      }
      catch {
        if (active)
          setSupported(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return supported;
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
  void SecureStore.deleteItemAsync(BIOMETRIC_TOKEN_KEY).catch(() => {});
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

async function promptBiometric(promptMessage: string): Promise<void> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel: translate('settings.cancel'),
    disableDeviceFallback: false,
  });
  if (!result.success) {
    const code = result.error ?? 'biometric_failed';
    throw Object.assign(new Error(code), { error: code, code });
  }
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

/** Prompts for the fingerprint, then binds this device to the signed-in account. */
export async function registerBiometricDevice(email: string): Promise<BiometricRegisterResponse> {
  await promptBiometric(translate('settings.biometric_login'));

  const response = await client<ApiResponse<BiometricRegisterResponse>>({
    url: '/api/auth/biometric/register',
    method: 'POST',
    data: { deviceName: buildDeviceName() },
  });

  const saved = response.data.data;
  await SecureStore.setItemAsync(BIOMETRIC_TOKEN_KEY, saved.biometricToken, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });

  setStoredPasskeyBinding({
    dbId: saved.id,
    credentialId: saved.credentialId,
    email: email.trim().toLowerCase(),
  });
  setLastLoginEmail(email);
  return saved;
}

const OFFER_KEY_PREFIX = 'biometric_offer_seen_v1:';

/**
 * After a password sign-in, offer fingerprint sign-in once per account and device: only when the device has an
 * enrolled fingerprint, this account is not bound yet, and the learner has not been asked before.
 */
export async function shouldOfferBiometric(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !isPasskeySupported() || storage.getBoolean(OFFER_KEY_PREFIX + normalized))
    return false;
  if (getStoredPasskeyBinding()?.email === normalized)
    return false;
  try {
    const [hasHardware, isEnrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    return hasHardware && isEnrolled;
  }
  catch {
    return false;
  }
}

export function markBiometricOffered(email: string) {
  storage.set(OFFER_KEY_PREFIX + email.trim().toLowerCase(), true);
}

export function useRegisterPasskey() {
  const queryClient = useQueryClient();

  return useMutation<BiometricRegisterResponse, unknown, { email: string }>({
    mutationFn: ({ email }) => registerBiometricDevice(email),
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
    mutationFn: async () => {
      const binding = getStoredPasskeyBinding();
      if (!binding) {
        throw new Error('NO_BIOMETRIC_BINDING');
      }

      await promptBiometric(translate('login.biometric_a11y'));

      const biometricToken = await SecureStore.getItemAsync(BIOMETRIC_TOKEN_KEY);
      if (!biometricToken) {
        clearStoredPasskeyBinding();
        throw new Error('MISSING_BIOMETRIC_TOKEN');
      }

      const verifyRes = await client<ApiResponse<ResponseLoginDTO>>({
        url: '/api/auth/biometric/login',
        method: 'POST',
        data: {
          credentialId: binding.credentialId,
          biometricToken,
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
