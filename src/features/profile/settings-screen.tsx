import type { ThemePreference, UpdateUserSettings } from './types';
import type { ColorSchemeType } from '@/lib/hooks';
import type { Language } from '@/lib/i18n/resources';
import Env from 'env';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView } from 'react-native';

import {
  Button,
  FocusAwareStatusBar,
  Pressable,
  SafeAreaView,
  showErrorMessage,
  Text,
  View,
} from '@/components/ui';
import {
  BookIcon,
  ChevronLeftIcon,
  Lock,
  NotificationBell,
  SettingsIcon,
  StarIcon,
} from '@/components/ui/icons';
import { useSelectedTheme } from '@/lib/hooks';
import { translate, useSelectedLanguage } from '@/lib/i18n';
import { useLogout, useUpdateSettings, useUserSettings } from './api';
import { OptionSheet } from './components/option-sheet';
import { SettingsRow } from './components/settings-row';
import { SettingsSection } from './components/settings-section';
import { formatTimeOfDay, reminderOptions } from './display';

const LANGUAGES = [
  { value: 'vi' as Language, label: 'Tiếng Việt' },
  { value: 'en' as Language, label: 'English' },
];

const THEMES: { value: ThemePreference; label: string; scheme: ColorSchemeType }[] = [
  { value: 'LIGHT', label: translate('settings.theme_light'), scheme: 'light' },
  { value: 'DARK', label: translate('settings.theme_dark'), scheme: 'dark' },
  { value: 'SYSTEM', label: translate('settings.theme_system'), scheme: 'system' },
];

const DAILY_GOALS = [5, 10, 20, 30, 50];

type Sheet = 'language' | 'theme' | 'goal' | 'reminder' | null;

/** MH-PROFILE-03. Biometric login and notification list are out of this round. */
export function SettingsScreen() {
  const router = useRouter();
  const [sheet, setSheet] = useState<Sheet>(null);

  const { data: settings } = useUserSettings();
  const updateSettings = useUpdateSettings();
  const logout = useLogout();
  const { setSelectedTheme } = useSelectedTheme();
  const { setLanguage } = useSelectedLanguage();

  // Language and appearance apply on this device straight away; the server copy
  // keeps them for the next install or another device.
  const save = (change: UpdateUserSettings) => {
    updateSettings.mutate(change, { onError: () => showErrorMessage(translate('settings.error')) });
  };

  const confirmLogout = () => {
    Alert.alert(
      translate('settings.logout_confirm_title'),
      translate('settings.logout_confirm_message'),
      [
        { text: translate('settings.cancel'), style: 'cancel' },
        { text: translate('settings.logout'), style: 'destructive', onPress: () => logout.mutate() },
      ],
    );
  };

  const languageLabel = LANGUAGES.find(l => l.value === settings?.uiLanguage)?.label;
  const themeLabel = THEMES.find(t => t.value === settings?.theme)?.label;
  const reminder = formatTimeOfDay(settings?.srsReminderAt);

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-background" edges={['top']}>
      <FocusAwareStatusBar />

      <View className="h-14 flex-row items-center border-b border-neutral-100 bg-white px-4 dark:border-neutral-800 dark:bg-neutral-900">
        <Pressable
          onPress={() => router.back()}
          testID="settings-back"
          className="-ml-1 size-10 items-center justify-center rounded-full active:bg-neutral-100"
        >
          <ChevronLeftIcon color="#1E2A44" />
        </Pressable>
        <Text
          className="mr-9 flex-1 text-center font-nunito text-lg font-extrabold text-mascot-navy dark:text-white"
          tx="settings.title"
        />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <SettingsSection tx="settings.account">
          <SettingsRow
            icon={<Lock color="#757793" />}
            tx="settings.change_password"
            onPress={() => router.push('/change-password')}
            testID="settings-change-password"
            last
          />
        </SettingsSection>

        <SettingsSection tx="settings.notifications">
          <SettingsRow
            icon={<NotificationBell color="#757793" />}
            tx="settings.push"
            toggle={{
              value: settings?.pushEnabled ?? true,
              onChange: value => save({ pushEnabled: value }),
              disabled: !settings,
            }}
            testID="settings-push"
            last
          />
        </SettingsSection>

        <SettingsSection tx="settings.learning">
          <SettingsRow
            icon={<BookIcon color="#757793" />}
            tx="settings.daily_goal"
            value={settings ? translate('settings.daily_goal_unit', { count: settings.dailyGoal }) : undefined}
            onPress={() => setSheet('goal')}
            testID="settings-daily-goal"
          />
          <SettingsRow
            icon={<StarIcon color="#757793" />}
            tx="settings.reminder"
            value={reminder ?? translate('settings.reminder_off')}
            onPress={() => setSheet('reminder')}
            testID="settings-reminder"
            last
          />
        </SettingsSection>

        <SettingsSection tx="settings.app">
          <SettingsRow
            icon={<SettingsIcon color="#757793" />}
            tx="settings.language"
            value={languageLabel}
            onPress={() => setSheet('language')}
            testID="settings-language"
          />
          <SettingsRow
            icon={<SettingsIcon color="#757793" />}
            tx="settings.theme"
            value={themeLabel}
            onPress={() => setSheet('theme')}
            testID="settings-theme"
            last
          />
        </SettingsSection>

        <Button
          tx="settings.logout"
          variant="danger"
          fullWidth
          loading={logout.isPending}
          onPress={confirmLogout}
          testID="settings-logout"
        />
        <Text className="mt-4 text-center text-xs text-neutral-400">
          {translate('settings.version', { version: Env.EXPO_PUBLIC_VERSION })}
        </Text>
      </ScrollView>

      <OptionSheet
        visible={sheet === 'language'}
        titleTx="settings.select_language"
        options={LANGUAGES}
        selected={(settings?.uiLanguage ?? 'vi') as Language}
        onSelect={(value) => {
          setLanguage(value);
          save({ uiLanguage: value });
          setSheet(null);
        }}
        onClose={() => setSheet(null)}
      />

      <OptionSheet
        visible={sheet === 'theme'}
        titleTx="settings.select_theme"
        options={THEMES}
        selected={settings?.theme ?? 'SYSTEM'}
        onSelect={(value) => {
          setSelectedTheme(THEMES.find(t => t.value === value)!.scheme);
          save({ theme: value });
          setSheet(null);
        }}
        onClose={() => setSheet(null)}
      />

      <OptionSheet
        visible={sheet === 'goal'}
        titleTx="settings.select_goal"
        options={DAILY_GOALS.map(goal => ({
          value: goal,
          label: translate('settings.daily_goal_unit', { count: goal }),
        }))}
        selected={settings?.dailyGoal ?? 20}
        onSelect={(value) => {
          save({ dailyGoal: value });
          setSheet(null);
        }}
        onClose={() => setSheet(null)}
      />

      <OptionSheet
        visible={sheet === 'reminder'}
        titleTx="settings.select_reminder"
        options={reminderOptions().map(time => ({ value: time, label: time }))}
        selected={reminder ?? ''}
        onSelect={(value) => {
          save({ srsReminderAt: value });
          setSheet(null);
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
