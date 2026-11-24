import type { Href } from 'expo-router';
import type { ReactNode } from 'react';
import type { User } from '../auth/api';
import type { InventoryItemDTO } from '@/features/shop/types';
import { useIsFocused } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AvatarFrame, Coin3D } from '@/components/snapvocab';
import {
  Button,
  FocusAwareStatusBar,
  Image,
  Mascot,
  Pressable,
  SafeAreaView,
  Text,
  useSurface,
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
import { ProfileBadgeStrip, useBadges } from '@/features/badges';
import { useStreak } from '@/features/progress/api';
import { useInventory } from '@/features/shop/hooks/use-shop-queries';
import { isBoosterLive } from '@/features/shop/utils/booster-timer';
import { translate } from '@/lib/i18n';
import { useMe } from './api';
import { formatDate, fullName, initials } from './display';
import { useIconColors } from './use-icon-colors';

/** Personal identity and live learning rewards. */
export function ProfileScreen() {
  const surface = useSurface();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const stored = useAuthStore(s => s.user);
  const iconColor = useIconColors();
  const { i18n } = useTranslation();
  const { data, isLoading, isError, refetch, isRefetching } = useMe();
  // Live streak from Progress; users.streakDays is stored and not reset after a missed day.
  const streak = useStreak();
  // Render the stored copy while the fresh one loads, so the screen never blanks.
  const user = data ?? stored;
  // Equipped frame and running booster come from the inventory (shop.md §11.3); no extra API.
  const inventory = useInventory();
  const badges = useBadges().data;
  const openAchievements = (badgeId?: number) =>
    router.push((badgeId ? `/profile/achievements?open=${badgeId}` : '/profile/achievements') as Href);
  const isFocused = useIsFocused();
  const [, tick] = useState(0);
  const frame = inventory.data?.items.find(i => i.type === 'AVATAR_FRAME' && i.equipped);
  const boosterLive = isBoosterLive(inventory.data?.activeBooster, inventory.serverOffset);
  useEffect(() => {
    if (!boosterLive || !isFocused)
      return;
    const timer = setInterval(() => tick(n => n + 1), 1000);
    return () => clearInterval(timer);
  }, [boosterLive, isFocused]);
  const failedSources = [
    isError && translate('profile.account_data'),
    streak.isError && translate('profile.streak'),
    inventory.isError && translate('profile.inventory_data'),
  ].filter(Boolean).join(', ');
  const retryFailed = () => Promise.allSettled([
    ...(isError ? [refetch()] : []),
    ...(streak.isError ? [streak.refetch()] : []),
    ...(inventory.isError ? [inventory.refetch()] : []),
  ]);

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
    <View style={{ flex: 1, backgroundColor: surface.background }}>
      <FocusAwareStatusBar />

      <View style={{ paddingTop: insets.top + 14, backgroundColor: surface.headerBg }} className="z-10 flex-row items-center justify-between border-b border-neutral-100 px-5 pb-3.5 dark:border-line">
        <Text
          className="font-nunito text-xl font-extrabold tracking-tight text-mascot-navy dark:text-white"
          tx="profile.title"
        />

        <View className="flex-row items-center gap-2">
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
        className="bg-background"
        contentContainerStyle={{ padding: 16, paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
      >
        {!!failedSources && (
          <View accessibilityRole="alert" className="mb-4 gap-3 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 dark:border-amber-500/40 dark:bg-amber-950/40">
            <Text className="font-inter text-sm text-amber-950 dark:text-amber-100">
              {translate('profile.refresh_error', { sections: failedSources })}
            </Text>
            <Button size="sm" variant="secondary" tx="profile.retry" onPress={retryFailed} loading={isRefetching || streak.isRefetching || inventory.isRefetching} />
          </View>
        )}
        <IdentityCard user={user} frame={frame} onEdit={() => router.push('/edit-profile')} locale={i18n.language}>
          <ProfileBadgeStrip view={badges} onPress={openAchievements} />
        </IdentityCard>

        <View className="mt-4 flex-row gap-3">
          <StatTile
            icon={<FlameIcon color={iconColor.stat.streak} />}
            tint="bg-mascot-100 border-mascot-200 dark:bg-mascot-500/15 dark:border-mascot-500/30"
            value={streak.data?.currentStreak ?? '–'}
            locale={i18n.language}
            labelTx="profile.streak"
          />
          <StatTile
            icon={<StarIcon color={iconColor.stat.xp} />}
            tint="bg-reward-50 border-reward-100 dark:bg-reward-500/15 dark:border-reward-500/30"
            value={user.exp ?? '–'}
            locale={i18n.language}
            labelTx="profile.xp"
          />
          <StatTile
            icon={<Coin3D size="sm" />}
            tint="bg-reward-50 border-reward-100 dark:bg-reward-500/15 dark:border-reward-500/30"
            value={user.coin ?? '–'}
            locale={i18n.language}
            labelTx="profile.coin"
          />
        </View>

        {boosterLive && !inventory.isError && (
          <View className="mt-3 rounded-xl border-2 border-reward-200 bg-reward-50 px-4 py-3 dark:border-reward-500/30 dark:bg-reward-500/10">
            <Text className="text-reward-800 font-nunito text-sm font-extrabold dark:text-reward-200">
              {translate('profile.booster_active', { multiplier: inventory.data!.activeBooster!.multiplier })}
            </Text>
            <Text className="text-reward-800 mt-1 font-inter text-xs dark:text-reward-200">
              {translate('profile.booster_hint')}
            </Text>
          </View>
        )}

        <View className="mt-5 overflow-hidden rounded-2xl border-2 border-b-4 border-line border-b-edge bg-surface">
          <ProfileMenuRow
            icon={<TrophyIcon color={iconColor.stat.trophy} width={20} height={20} />}
            tint="bg-reward-50 border-reward-100 dark:bg-reward-500/15 dark:border-reward-500/30"
            tx="profile.menu.achievements"
            hintTx="profile.menu_hints.achievements"
            hint={badges ? translate('badges.profile.count', { earned: badges.earnedCount, total: badges.totalCount }) : undefined}
            dot={(badges?.unseenCount ?? 0) > 0}
            chevron={iconColor.muted}
            onPress={() => openAchievements()}
          />
          <ProfileMenuRow
            icon={<Coin3D size="sm" />}
            tint="bg-reward-50 border-reward-100 dark:bg-reward-500/15 dark:border-reward-500/30"
            tx="profile.menu.wallet"
            hintTx="profile.menu_hints.wallet"
            chevron={iconColor.muted}
            onPress={() => router.push('/profile/wallet' as Href)}
          />
          <ProfileMenuRow
            icon={<BoxIcon color={iconColor.stat.inventory} width={20} height={20} />}
            tint="bg-purple-50 border-purple-100 dark:bg-purple-500/15 dark:border-purple-500/30"
            tx="profile.menu.inventory"
            hintTx="profile.menu_hints.inventory"
            chevron={iconColor.muted}
            onPress={() => router.push('/profile/inventory' as Href)}
            last
          />
        </View>

      </ScrollView>
    </View>
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
      accessibilityRole="button"
      className="size-11 items-center justify-center rounded-xl border-2 border-b-4 border-line border-b-edge bg-surface active:translate-y-[2px] active:border-b-2"
    >
      {children}
    </Pressable>
  );
}

function IdentityCard({ user, frame, onEdit, locale, children }: { user: User; frame?: InventoryItemDTO; onEdit: () => void; locale: string; children?: ReactNode }) {
  const name = fullName(user);
  const joined = formatDate(user.createdAt, locale);

  return (
    <View className="gap-4 rounded-2xl border-2 border-b-4 border-line border-b-edge bg-surface p-4">
      <View className="flex-row items-center gap-4">
        {frame ? (
        // Same renderer as the Shop preview, so the bought frame looks the same here.
          <AvatarFrame
            frameUrl={frame.config?.frameUrl}
            avatarUri={user.avatarUrl}
            initials={initials(name)}
            size={80}
          />
        ) : (
          <View className="size-20 shrink-0 items-center justify-center rounded-full border-2 border-primary-400 bg-primary-50/50 p-1 dark:bg-primary-500/10">
            <View className="size-full items-center justify-center overflow-hidden rounded-full bg-primary-500">
              {user.avatarUrl
                ? <Image source={{ uri: user.avatarUrl }} contentFit="cover" style={{ width: '100%', height: '100%' }} />
                : <Text className="font-nunito text-2xl font-extrabold text-[#17330B] dark:text-[#17330B]">{initials(name)}</Text>}
            </View>
          </View>
        )}

        <View className="min-w-0 flex-1">
          <Text className="mb-1 font-nunito text-[22px] font-black text-mascot-navy dark:text-white">
            {name}
          </Text>

          {/* An email is far longer than the design's username, so it gets its own line. */}
          <Text numberOfLines={1} className="text-[13px] font-semibold text-neutral-500 dark:text-neutral-300">
            {user.email}
          </Text>
          {!!joined && (
            <Text className="mt-1 text-xs font-medium text-neutral-500 dark:text-neutral-400">
              {translate('profile.joined', { date: joined })}
            </Text>
          )}
        </View>
      </View>

      {!!user.bio && (
        <Text className="text-center text-sm text-neutral-600 dark:text-neutral-300">{user.bio}</Text>
      )}
      {children}
      <Button size="sm" variant="secondary" tx="profile.edit" testID="profile-edit-button" onPress={onEdit} icon={<EditIcon width={16} height={16} color="#757793" />} />
    </View>
  );
}

function StatTile({
  icon,
  tint,
  value,
  labelTx,
  locale,
}: {
  icon: ReactNode;
  tint: string;
  value: number | string;
  labelTx: 'profile.streak' | 'profile.xp' | 'profile.coin';
  locale: string;
}) {
  const formatted = typeof value === 'number' ? value.toLocaleString(locale) : value;
  return (
    <View accessible accessibilityLabel={`${translate(labelTx)}: ${formatted}`} className="min-w-0 flex-1 items-center rounded-2xl border-2 border-b-4 border-line border-b-edge bg-surface px-2 py-3.5">
      <View className={`mb-2 size-9 items-center justify-center rounded-xl border ${tint}`}>
        {icon}
      </View>
      <Text adjustsFontSizeToFit minimumFontScale={0.7} numberOfLines={1} className="max-w-full font-nunito text-lg font-black text-mascot-navy dark:text-white">{formatted}</Text>
      <Text
        className="mt-0.5 text-center text-[11px] font-bold text-neutral-500 uppercase dark:text-neutral-300"
        tx={labelTx}
      />
    </View>
  );
}

function ProfileMenuRow({
  icon,
  tint,
  tx,
  hintTx,
  chevron,
  last,
  onPress,
  hint,
  dot,
}: {
  icon: ReactNode;
  tint: string;
  tx: 'profile.menu.achievements' | 'profile.menu.wallet' | 'profile.menu.inventory';
  hintTx: 'profile.menu_hints.achievements' | 'profile.menu_hints.wallet' | 'profile.menu_hints.inventory';
  chevron: string;
  last?: boolean;
  onPress: () => void;
  /** Live summary replacing the static hint, e.g. "4/12 huy hiệu". */
  hint?: string;
  /** Unseen-badge dot on the icon tile (badges.md §2.3). */
  dot?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={translate(tx)}
      accessibilityHint={[hint ?? translate(hintTx), dot ? translate('badges.profile.has_new') : null].filter(Boolean).join(', ')}
      onPress={onPress}
      className={`flex-row items-center p-4 active:bg-pressed ${last ? '' : 'border-b border-neutral-100 dark:border-line'}`}
    >
      <View className={`mr-3.5 size-10 items-center justify-center rounded-xl border ${tint}`}>
        {icon}
        {dot && <View className="absolute -top-1 -right-1 size-[11px] rounded-full border-2 border-white bg-danger-500 dark:border-neutral-900" />}
      </View>
      <View className="flex-1">
        <Text className="font-nunito text-[16px] font-black text-mascot-navy dark:text-white" tx={tx} />
        {hint
          ? <Text className="text-[13px] font-medium text-neutral-500 dark:text-neutral-300">{hint}</Text>
          : <Text className="text-[13px] font-medium text-neutral-500 dark:text-neutral-300" tx={hintTx} />}
      </View>
      <ChevronRightIcon color={chevron} width={18} height={18} />
    </Pressable>
  );
}
