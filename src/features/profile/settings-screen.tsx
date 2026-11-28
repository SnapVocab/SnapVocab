import type { Href } from 'expo-router';
import type { ThemePreference, UpdateUserSettings } from './types';
import type { PushPermission } from '@/features/notifications/push';
import type { ColorSchemeType } from '@/lib/hooks/use-selected-theme';
import type { Language } from '@/lib/i18n/resources';
import Env from 'env';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState, Linking, ScrollView } from 'react-native';

import {
  BackButton,
  FocusAwareStatusBar,
  Mascot,
  Pressable,
  SafeAreaView,
  showDialog,
  showErrorMessage,
  Text,
  View,
} from '@/components/ui';
import {
  BellIcon,
  ClockRotateIcon,
  FingerprintIcon,
  GlobeIcon,
  LayoutGridIcon,
  LogOutIcon,
  PasswordIcon,
  TargetIcon,
  ThemeModeIcon,
} from '@/components/ui/icons';
import {
  clearStoredPasskeyBinding,
  getStoredPasskeyBinding,
  isPasskeyCancelledError,
  useBiometricSupported,
  useDisablePasskey,
  usePasskeyCredentials,
  useRegisterPasskey,
} from '@/features/auth/passkey';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { askPermission, pushToggle, readPermission, registerDevice } from '@/features/notifications/push';
import { useSelectedTheme } from '@/lib/hooks/use-selected-theme';
import { translate, useSelectedLanguage } from '@/lib/i18n';
import { storage } from '@/lib/storage';
import { useLogout, useUpdateSettings, useUserSettings } from './api';
import { OptionSheet } from './components/option-sheet';
import { SettingsRow } from './components/settings-row';
import { SettingsSection } from './components/settings-section';
import { formatTimeOfDay, reminderOptions } from './display';
import { useIconColors } from './use-icon-colors';

const LANGUAGES = [
  { value: 'vi' as Language, label: translate('settings.language_name_vi'), emoji: '🇻🇳' },
  { value: 'en' as Language, label: translate('settings.language_name_en'), emoji: '🇬🇧' },
];

const THEMES: { value: ThemePreference; label: string; scheme: ColorSchemeType }[] = [
  { value: 'LIGHT', label: translate('settings.theme_light'), scheme: 'light' },
  { value: 'DARK', label: translate('settings.theme_dark'), scheme: 'dark' },
  { value: 'SYSTEM', label: translate('settings.theme_system'), scheme: 'system' },
];

/** The row icons follow the muted grey of the design. */
const ROW_ICON_SIZE = 22;

type Sheet = 'language' | 'theme' | 'reminder' | null;

/** MH-PROFILE-03. Biometric login is out of this round; OS permission states wait for expo-notifications (DEP-NOTIF-02). */
export function SettingsScreen() {
  const router = useRouter();
  const [sheet, setSheet] = useState<Sheet>(null);
  const iconColor = useIconColors();

  const { data: settings } = useUserSettings();
  const updateSettings = useUpdateSettings();
  const logout = useLogout();
  const userEmail = useAuthStore(s => s.user?.email ?? '');
  const { selectedTheme, setSelectedTheme } = useSelectedTheme();
  const { language, setLanguage } = useSelectedLanguage();

  const passkeySupported = useBiometricSupported();
  const [localBinding, setLocalBinding] = useState(() => getStoredPasskeyBinding());
  const { data: passkeyCredentials } = usePasskeyCredentials(passkeySupported);
  const registerPasskey = useRegisterPasskey();
  const disablePasskey = useDisablePasskey();

  const normalizedEmail = userEmail.trim().toLowerCase();
  const bindingForCurrentUser = localBinding && localBinding.email === normalizedEmail
    ? localBinding
    : null;
  const matchedCredential = bindingForCurrentUser && passkeyCredentials
    ? passkeyCredentials.find(cred => cred.credentialId === bindingForCurrentUser.credentialId) ?? null
    : null;
  const activeDeviceCredential = bindingForCurrentUser
    ? (passkeyCredentials ? matchedCredential : { id: bindingForCurrentUser.dbId })
    : null;
  const biometricEnabled = Boolean(activeDeviceCredential);
  const biometricBusy = registerPasskey.isPending || disablePasskey.isPending;

  const handleToggleBiometric = async (enable: boolean) => {
    if (!passkeySupported || !userEmail)
      return;

    if (enable) {
      try {
        await registerPasskey.mutateAsync({ email: userEmail });
        setLocalBinding(getStoredPasskeyBinding());
      }
      catch (error) {
        if (!isPasskeyCancelledError(error)) {
          showErrorMessage(translate('settings.biometric_error'));
        }
      }
      return;
    }

    if (!activeDeviceCredential) {
      clearStoredPasskeyBinding();
      setLocalBinding(null);
      return;
    }

    try {
      await disablePasskey.mutateAsync({ dbId: activeDeviceCredential.id });
      setLocalBinding(null);
    }
    catch {
      showErrorMessage(translate('settings.error'));
    }
  };

  // Account learning preferences use the API; appearance/language stay on this device.
  const save = (change: UpdateUserSettings) => {
    updateSettings.mutate(change, { onError: () => showErrorMessage(translate('settings.error')) });
  };

  const confirmLogout = () => {
    showDialog({
      title: translate('settings.logout_confirm_title'),
      message: translate('settings.logout_confirm_message'),
      icon: LogOutIcon,
      buttons: [
        { text: translate('settings.cancel'), style: 'cancel' },
        { text: translate('settings.logout'), style: 'destructive', onPress: () => logout.mutate() },
      ],
    });
  };

  // OS permission is per device, pushEnabled per account (§3.9): seed from MMKV to avoid first-frame flicker,
  // then re-read when coming back from the OS settings.
  const [permission, setPermission] = useState<PushPermission>(() => {
    const cached = storage.getString('push_permission_cached');
    return cached === 'granted' || cached === 'denied' || cached === 'undetermined'
      ? cached
      : 'undetermined';
  });
  useEffect(() => {
    const read = () => void readPermission().then((next) => {
      storage.set('push_permission_cached', next);
      setPermission(next);
    }).catch(() => {});
    read();
    const subscription = AppState.addEventListener('change', state => state === 'active' && read());
    return () => subscription.remove();
  }, []);
  const push = pushToggle(permission, settings?.pushEnabled ?? true);

  /** Asks the OS only while undetermined; granted ⇒ register this device (A5). */
  const allowPush = async () => {
    const next = await askPermission().catch(() => permission);
    storage.set('push_permission_cached', next);
    setPermission(next);
    if (next === 'granted')
      void registerDevice().catch(() => {});
    return next === 'granted';
  };

  const changePush = async (value: boolean) => {
    if (push.blocked) {
      void Linking.openSettings(); // the app cannot ask again once denied
      return;
    }
    if (!value) {
      save({ pushEnabled: false });
      return;
    }
    if (await allowPush())
      save({ pushEnabled: true });
  };

  const languageLabel = LANGUAGES.find(l => l.value === language)?.label;
  const localTheme = THEMES.find(t => t.scheme === selectedTheme)!;
  const themeLabel = localTheme.label;
  const reminder = formatTimeOfDay(settings?.srsReminderAt);

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-background" edges={['top', 'bottom']}>
      <FocusAwareStatusBar />

      <View className="h-14 flex-row items-center border-b border-line bg-surface px-4">
        <BackButton onPress={() => router.back()} testID="settings-back" className="-ml-1" />
        <Text
          className="mr-9 flex-1 text-center font-nunito text-lg font-extrabold text-mascot-navy dark:text-white"
          tx="settings.title"
        />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <SettingsSection tx="settings.account">
          <SettingsRow
            icon={<PasswordIcon color={iconColor.row.password} size={ROW_ICON_SIZE} />}
            tx="settings.change_password"
            onPress={() => router.push('/change-password')}
            testID="settings-change-password"
            last
          />
        </SettingsSection>

        <SettingsSection tx="settings.security">
          <SettingsRow
            icon={<FingerprintIcon color={iconColor.row.biometric} size={ROW_ICON_SIZE} />}
            tx="settings.biometric_login"
            toggle={{
              value: biometricEnabled,
              onChange: value => void handleToggleBiometric(value),
              disabled: !passkeySupported || biometricBusy,
            }}
            hint={!passkeySupported ? translate('settings.biometric_unsupported') : undefined}
            testID="settings-biometric"
            last
          />
        </SettingsSection>

        {/* Push has one kind (the review reminder), so its channel and its time sit together (notification_ui.md §H.5). */}
        <SettingsSection tx="settings.notifications">
          <SettingsRow
            icon={<BellIcon color={iconColor.row.notification} size={ROW_ICON_SIZE} />}
            tx="settings.push"
            toggle={{
              value: push.on,
              onChange: value => void changePush(value),
              disabled: !settings,
            }}
            hint={push.blocked ? translate('settings.push_blocked') : undefined}
            testID="settings-push"
          />
          <SettingsRow
            icon={<ClockRotateIcon color={iconColor.row.reminder} size={ROW_ICON_SIZE} />}
            tx="settings.reminder"
            value={reminder ?? translate('settings.reminder_off')}
            hint={reminder && settings && !push.on ? translate('settings.reminder_inbox_only') : undefined}
            onPress={() => setSheet('reminder')}
            testID="settings-reminder"
            last
          />
        </SettingsSection>

        <SettingsSection tx="settings.learning">
          <SettingsRow
            icon={<TargetIcon color={iconColor.row.goal} size={ROW_ICON_SIZE} />}
            tx="study_limits.collection_limits"
            hint={translate('study_limits.global_hint')}
            onPress={() => router.push('/study-limits' as Href)}
            testID="settings-collection-limits"
          />
          <SettingsRow
            icon={<LayoutGridIcon color={iconColor.row.goal} size={ROW_ICON_SIZE} />}
            tx="template_builder.library.title"
            hint={translate('template_builder.library.settings_hint')}
            onPress={() => router.push('/template-library' as Href)}
            testID="settings-template-library"
            last
          />
        </SettingsSection>

        <SettingsSection tx="settings.app">
          <SettingsRow
            icon={<GlobeIcon color={iconColor.row.language} size={ROW_ICON_SIZE} />}
            tx="settings.language"
            value={languageLabel}
            onPress={() => setSheet('language')}
            testID="settings-language"
          />
          <SettingsRow
            icon={<ThemeModeIcon color={iconColor.row.theme} size={ROW_ICON_SIZE} />}
            tx="settings.theme"
            value={themeLabel}
            onPress={() => setSheet('theme')}
            testID="settings-theme"
            last
          />
        </SettingsSection>

        <View className="mt-8 overflow-hidden rounded-3xl border border-danger-100 bg-surface shadow-sm shadow-black/5 dark:border-danger-500/30">
          <Pressable
            onPress={confirmLogout}
            disabled={logout.isPending}
            testID="settings-logout"
            className="flex-row items-center justify-center p-4 active:bg-danger-50 dark:active:bg-danger-500/10"
          >
            <LogOutIcon color={iconColor.danger} width={20} height={20} />
            <Text
              className="ml-2 font-nunito text-base font-extrabold text-danger-600 dark:text-danger-400"
              tx="settings.logout"
            />
          </Pressable>
        </View>

        <View className="mt-6 items-center">
          <Mascot pose="wave" className="mb-2 size-12 opacity-60" />
          <Text className="font-nunito text-sm font-bold text-neutral-400">SnapVocab</Text>
          <Text className="text-xs font-medium text-neutral-400">
            {translate('settings.version', { version: Env.EXPO_PUBLIC_VERSION })}
          </Text>
        </View>
      </ScrollView>

      <OptionSheet
        visible={sheet === 'language'}
        titleTx="settings.select_language"
        options={LANGUAGES}
        selected={language}
        onSelect={(value) => {
          setSheet(null);
          setLanguage(value);
        }}
        onClose={() => setSheet(null)}
      />

      <OptionSheet
        visible={sheet === 'theme'}
        titleTx="settings.select_theme"
        options={THEMES}
        selected={localTheme.value}
        onSelect={(value) => {
          setSelectedTheme(THEMES.find(t => t.value === value)!.scheme);
          setSheet(null);
        }}
        onClose={() => setSheet(null)}
      />

      <OptionSheet
        visible={sheet === 'reminder'}
        titleTx="settings.select_reminder"
        descriptionTx="settings.reminder_sheet_desc"
        options={reminderOptions().map(time => ({ value: time, label: time }))}
        fallbackScrollValue="20:00"
        selected={reminder ?? ''}
        onSelect={(value) => {
          save({ srsReminderAt: value });
          setSheet(null);
          void allowPush(); // contextual permission prompt (§3.9 b)
        }}
        clearTx="settings.turn_off"
        onClear={() => {
          save({ srsReminderCleared: true });
          setSheet(null);
        }}
        onClose={() => setSheet(null)}
      />
    </SafeAreaView>
  );
}
