import type { ReactNode } from 'react';
import type { User } from '../auth/api';
import { useRouter } from 'expo-router';
import { ScrollView } from 'react-native';
import {
  Button,
  FocusAwareStatusBar,
  Image,
  Mascot,
  Pressable,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import {
  BoxIcon,
  ChevronRightIcon,
  EditIcon,
  FlameIcon,
  SettingsIcon,
  StarIcon,
  TrophyIcon,
  WalletIcon,
} from '@/components/ui/icons';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { translate } from '@/lib/i18n';
import { useMe } from './api';
import { formatDate, fullName, initials } from './display';
import { useIconColors } from './use-icon-colors';

/** MH-PROFILE-01. Achievements, inventory and wallet wait for the gamification work. */
export function ProfileScreen() {
  const router = useRouter();
  const stored = useAuthStore(s => s.user);
  const iconColor = useIconColors();
  const { data, isLoading, refetch, isRefetching } = useMe();
  // Render the stored copy while the fresh one loads, so the screen never blanks.
  const user = data ?? stored;

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-background" edges={['top']}>
        <FocusAwareStatusBar />
        <View style={{ flex: 1 }} className="flex-1 items-center justify-center px-8">
          <Mascot pose="sad" className="mb-4 size-32" />
          <Text
            className="mb-2 text-center font-nunito text-xl font-extrabold text-mascot-navy dark:text-white"
            tx={isLoading ? 'profile.title' : 'profile.error_title'}
          />
          {!isLoading && (
            <>
              <Text className="mb-6 text-center text-sm text-neutral-500" tx="profile.error_description" />
              <Button tx="profile.retry" loading={isRefetching} onPress={() => refetch()} className="px-6" />
            </>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-background" edges={['top']}>
      <FocusAwareStatusBar />

      <View className="z-10 flex-row items-center justify-between border-b border-neutral-100 bg-white px-5 py-3.5 dark:border-neutral-800 dark:bg-neutral-900">
        <Text
          className="font-nunito text-xl font-extrabold tracking-tight text-mascot-navy dark:text-white"
          tx="profile.title"
        />

        <View className="flex-row items-center gap-2">
          <HeaderButton
            onPress={() => router.push('/edit-profile')}
            testID="profile-edit-button"
            label={translate('profile.edit')}
          >
            <EditIcon color={iconColor.action} width={18} height={18} />
          </HeaderButton>
          <HeaderButton
            onPress={() => router.push('/settings')}
            testID="profile-settings-button"
            label={translate('profile.settings')}
          >
            <SettingsIcon color={iconColor.action} width={19} height={19} />
          </HeaderButton>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
      >
        <IdentityCard user={user} />

        <View className="mt-4 flex-row gap-3">
          <StatTile
            icon={<FlameIcon color={iconColor.stat.streak} />}
            tint="bg-mascot-100 border-mascot-200 dark:bg-mascot-500/15 dark:border-mascot-500/30"
            value={user.streakDays ?? 0}
            labelTx="profile.streak"
          />
          <StatTile
            icon={<StarIcon color={iconColor.stat.xp} />}
            tint="bg-reward-50 border-reward-100 dark:bg-reward-500/15 dark:border-reward-500/30"
            value={user.exp ?? 0}
            labelTx="profile.xp"
          />
          <StatTile
            icon={<WalletIcon color={iconColor.stat.coin} />}
            tint="bg-info-50 border-info-100 dark:bg-info-500/15 dark:border-info-500/30"
            value={user.coin ?? 0}
            labelTx="profile.coin"
          />
        </View>

        {/* Gamification screens are not built yet; the rows show what is coming. */}
        <View className="mt-5 overflow-hidden rounded-3xl border border-neutral-200/80 bg-white shadow-sm shadow-black/5 dark:border-neutral-800 dark:bg-neutral-900">
          <ComingSoonRow
            icon={<TrophyIcon color={iconColor.stat.trophy} width={20} height={20} />}
            tint="bg-reward-50 border-reward-100 dark:bg-reward-500/15 dark:border-reward-500/30"
            tx="profile.menu.achievements"
            hintTx="profile.menu_hints.achievements"
            chevron={iconColor.muted}
          />
          <ComingSoonRow
            icon={<WalletIcon color={iconColor.stat.coin} width={20} height={20} />}
            tint="bg-info-50 border-info-100 dark:bg-info-500/15 dark:border-info-500/30"
            tx="profile.menu.wallet"
            hintTx="profile.menu_hints.wallet"
            chevron={iconColor.muted}
          />
          <ComingSoonRow
            icon={<BoxIcon color={iconColor.stat.inventory} width={20} height={20} />}
            tint="bg-purple-50 border-purple-100 dark:bg-purple-500/15 dark:border-purple-500/30"
            tx="profile.menu.inventory"
            hintTx="profile.menu_hints.inventory"
            chevron={iconColor.muted}
            last
          />
        </View>

        <View className="items-center pt-6 pb-2">
          <Text className="text-xs font-bold text-neutral-400">SnapVocab</Text>
          <Text className="mt-0.5 text-[11px] font-medium text-neutral-400" tx="profile.tagline" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function HeaderButton({
  children,
  onPress,
  testID,
  label,
}: {
  children: ReactNode;
  onPress: () => void;
  testID: string;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      accessibilityLabel={label}
      className="size-10 items-center justify-center rounded-full border border-neutral-200/60 bg-neutral-50 active:scale-95 dark:border-neutral-700 dark:bg-neutral-800"
    >
      {children}
    </Pressable>
  );
}

function IdentityCard({ user }: { user: User }) {
  const name = fullName(user);
  const joined = formatDate(user.createdAt);

  return (
    <View className="items-center rounded-3xl border border-neutral-200/80 bg-white p-5 shadow-sm shadow-black/5 dark:border-neutral-800 dark:bg-neutral-900">
      <View className="mb-3 size-28 items-center justify-center rounded-full border-2 border-primary-400 bg-primary-50/50 p-1.5 dark:bg-primary-500/10">
        <View className="size-full items-center justify-center overflow-hidden rounded-full bg-primary-500">
          {user.avatarUrl
            ? <Image source={{ uri: user.avatarUrl }} contentFit="cover" style={{ width: '100%', height: '100%' }} />
            : <Text className="font-nunito text-3xl font-extrabold text-white">{initials(name)}</Text>}
        </View>
      </View>

      <Text className="mb-1 text-center font-nunito text-[22px] font-extrabold text-mascot-navy dark:text-white">
        {name}
      </Text>

      {/* An email is far longer than the design's username, so it gets its own line. */}
      <Text numberOfLines={1} className="max-w-full text-[13px] font-semibold text-neutral-400">
        {user.email}
      </Text>
      {!!joined && (
        <Text className="mt-0.5 mb-3 text-[13px] font-medium text-neutral-400">
          {translate('profile.joined', { date: joined })}
        </Text>
      )}

      {!!user.bio && (
        <Text className="text-center text-sm text-neutral-600 dark:text-neutral-300">{user.bio}</Text>
      )}
    </View>
  );
}

function StatTile({
  icon,
  tint,
  value,
  labelTx,
}: {
  icon: ReactNode;
  tint: string;
  value: number;
  labelTx: 'profile.streak' | 'profile.xp' | 'profile.coin';
}) {
  return (
    <View className="flex-1 items-center rounded-2xl border border-neutral-200/80 bg-white p-3.5 shadow-sm shadow-black/5 dark:border-neutral-800 dark:bg-neutral-900">
      <View className={`mb-2 size-9 items-center justify-center rounded-xl border ${tint}`}>
        {icon}
      </View>
      <Text className="font-nunito text-lg font-extrabold text-mascot-navy dark:text-white">{value}</Text>
      <Text
        className="mt-0.5 text-center text-[11px] font-bold text-neutral-500 uppercase dark:text-neutral-300"
        tx={labelTx}
      />
    </View>
  );
}

function ComingSoonRow({
  icon,
  tint,
  tx,
  hintTx,
  chevron,
  last,
}: {
  icon: ReactNode;
  tint: string;
  tx: 'profile.menu.achievements' | 'profile.menu.wallet' | 'profile.menu.inventory';
  hintTx: 'profile.menu_hints.achievements' | 'profile.menu_hints.wallet' | 'profile.menu_hints.inventory';
  chevron: string;
  last?: boolean;
}) {
  return (
    <View className={`flex-row items-center p-4 ${last ? '' : 'border-b border-neutral-100 dark:border-neutral-800'}`}>
      <View className={`mr-3.5 size-10 items-center justify-center rounded-xl border ${tint}`}>
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-[15px] font-bold text-neutral-600 dark:text-neutral-200" tx={tx} />
        <Text className="text-xs font-medium text-neutral-400" tx={hintTx} />
      </View>
      <View className="mr-1 rounded-full bg-neutral-100 px-2 py-0.5 dark:bg-neutral-800">
        <Text className="text-[11px] font-bold text-neutral-500 dark:text-neutral-300" tx="profile.coming_soon" />
      </View>
      <ChevronRightIcon color={chevron} width={18} height={18} />
    </View>
  );
}
