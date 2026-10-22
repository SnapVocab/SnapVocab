import type { ThemePreference, UpdateUserSettings } from './types';
import type { ColorSchemeType } from '@/lib/hooks';
import type { Language } from '@/lib/i18n/resources';
import Env from 'env';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView } from 'react-native';

import {
  BackButton,
  FocusAwareStatusBar,
  Mascot,
  Pressable,
  SafeAreaView,
  showErrorMessage,
  Text,
  View,
} from '@/components/ui';
import {
  BellIcon,
  ClockRotateIcon,
  GlobeIcon,
  LogOutIcon,
  PasswordIcon,
  TargetIcon,
  ThemeModeIcon,
} from '@/components/ui/icons';
import { useSelectedTheme } from '@/lib/hooks';
import { translate, useSelectedLanguage } from '@/lib/i18n';
import { useLogout, useUpdateSettings, useUserSettings } from './api';
import { OptionSheet } from './components/option-sheet';
import { SettingsRow } from './components/settings-row';
import { SettingsSection } from './components/settings-section';
import { formatTimeOfDay, reminderOptions } from './display';
import { useIconColors } from './use-icon-colors';

const LANGUAGES = [
  { value: 'vi' as Language, label: 'Tiếng Việt', emoji: '🇻🇳' },
  { value: 'en' as Language, label: 'English', emoji: '🇬🇧' },
];

const THEMES: { value: ThemePreference; label: string; scheme: ColorSchemeType }[] = [
  { value: 'LIGHT', label: translate('settings.theme_light'), scheme: 'light' },
  { value: 'DARK', label: translate('settings.theme_dark'), scheme: 'dark' },
  { value: 'SYSTEM', label: translate('settings.theme_system'), scheme: 'system' },
];

const DAILY_GOALS = [5, 10, 20, 30, 50];

/** The row icons follow the muted grey of the design. */
const ROW_ICON_SIZE = 22;

type Sheet = 'language' | 'theme' | 'goal' | 'reminder' | null;

/** MH-PROFILE-03. Biometric login is out of this round; OS permission states wait for expo-notifications (DEP-NOTIF-02). */
export function SettingsScreen() {
  const router = useRouter();
  const [sheet, setSheet] = useState<Sheet>(null);
  const iconColor = useIconColors();

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
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-background" edges={['top', 'bottom']}>
      <FocusAwareStatusBar />

      <View className="h-14 flex-row items-center border-b border-neutral-100 bg-white px-4 dark:border-neutral-800 dark:bg-neutral-900">
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

        {/* Push has one kind (the review reminder), so its channel and its time sit together (notification_ui.md §H.5). */}
        <SettingsSection tx="settings.notifications">
          <SettingsRow
            icon={<BellIcon color={iconColor.row.notification} size={ROW_ICON_SIZE} />}
            tx="settings.push"
            toggle={{
              value: settings?.pushEnabled ?? true,
              onChange: value => save({ pushEnabled: value }),
              disabled: !settings,
            }}
            testID="settings-push"
          />
          <SettingsRow
            icon={<ClockRotateIcon color={iconColor.row.reminder} size={ROW_ICON_SIZE} />}
            tx="settings.reminder"
            value={reminder ?? translate('settings.reminder_off')}
            hint={reminder && settings?.pushEnabled === false ? translate('settings.reminder_inbox_only') : undefined}
            onPress={() => setSheet('reminder')}
            testID="settings-reminder"
            last
          />
        </SettingsSection>

        <SettingsSection tx="settings.learning">
          <SettingsRow
            icon={<TargetIcon color={iconColor.row.goal} size={ROW_ICON_SIZE} />}
            tx="settings.daily_goal"
            value={settings ? translate('settings.daily_goal_unit', { count: settings.dailyGoal }) : undefined}
            onPress={() => setSheet('goal')}
            testID="settings-daily-goal"
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

        <View className="mt-8 overflow-hidden rounded-3xl border border-danger-100 bg-white shadow-sm shadow-black/5 dark:border-danger-500/30 dark:bg-neutral-900">
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
        selected={(settings?.uiLanguage ?? 'vi') as Language}
        onSelect={(value) => {
          setSheet(null);
          // Switching the language restarts the app, so let the save finish
          // first; otherwise the reload cuts the request off.
          updateSettings.mutate({ uiLanguage: value }, {
            onError: () => showErrorMessage(translate('settings.error')),
            onSettled: () => setLanguage(value),
          });
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
        descriptionTx="settings.reminder_sheet_desc"
        options={reminderOptions().map(time => ({ value: time, label: time }))}
        fallbackScrollValue="20:00"
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
