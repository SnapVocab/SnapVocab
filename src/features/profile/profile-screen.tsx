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

/** MH-PROFILE-01. Achievements, inventory and wallet wait for the gamification work. */
export function ProfileScreen() {
  const router = useRouter();
  const stored = useAuthStore(s => s.user);
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

      <View className="z-10 flex-row items-center justify-between border-b border-neutral-100 bg-white px-5 py-3 dark:border-neutral-800 dark:bg-neutral-900">
        <Text
          className="font-nunito text-xl font-extrabold tracking-tight text-mascot-navy dark:text-white"
          tx="profile.title"
        />
        <Pressable
          onPress={() => router.push('/settings')}
          testID="profile-settings-button"
          className="size-10 items-center justify-center rounded-full border border-neutral-200/60 bg-neutral-50 active:scale-95 dark:border-neutral-700 dark:bg-neutral-800"
          accessibilityLabel={translate('profile.settings')}
        >
          <SettingsIcon color="#565879" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <IdentityCard user={user} onEdit={() => router.push('/edit-profile')} />

        <View className="mt-4 flex-row gap-3">
          <StatTile icon={<FlameIcon color="#FF9600" />} value={user.streakDays ?? 0} labelTx="profile.streak" />
          <StatTile icon={<StarIcon color="#FFC42E" />} value={user.exp ?? 0} labelTx="profile.xp" />
          <StatTile icon={<WalletIcon color="#1CB0F6" />} value={user.coin ?? 0} labelTx="profile.coin" />
        </View>

        {/* Gamification screens are not built yet; the rows show what is coming. */}
        <View className="mt-5 overflow-hidden rounded-3xl border border-neutral-100 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <ComingSoonRow icon={<TrophyIcon color="#9CA3AF" />} tx="profile.menu.achievements" />
          <ComingSoonRow icon={<WalletIcon color="#9CA3AF" />} tx="profile.menu.wallet" />
          <ComingSoonRow icon={<StarIcon color="#9CA3AF" />} tx="profile.menu.inventory" last />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function IdentityCard({ user, onEdit }: { user: User; onEdit: () => void }) {
  const name = fullName(user);
  const joined = formatDate(user.createdAt);

  return (
    <View className="items-center rounded-3xl border border-neutral-200/80 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <View className="mb-3 size-28 items-center justify-center overflow-hidden rounded-full bg-primary-500">
        {user.avatarUrl
          ? <Image source={{ uri: user.avatarUrl }} contentFit="cover" style={{ width: '100%', height: '100%' }} />
          : <Text className="font-nunito text-3xl font-extrabold text-white">{initials(name)}</Text>}
      </View>

      <Text className="mb-0.5 text-center font-nunito text-[22px] font-extrabold text-mascot-navy dark:text-white">
        {name}
      </Text>
      <Text className="mb-3.5 text-[13px] font-semibold text-neutral-400">{user.email}</Text>
      {!!joined && (
        <Text className="mb-2 text-xs text-neutral-400">
          {translate('profile.joined', { date: joined })}
        </Text>
      )}

      {!!user.bio && (
        <Text className="mb-3 text-center text-sm text-neutral-600 dark:text-neutral-300">{user.bio}</Text>
      )}

      <Button
        tx="profile.edit"
        variant="outline"
        size="sm"
        icon={<EditIcon color="#565879" />}
        onPress={onEdit}
        testID="profile-edit-button"
        className="px-5"
      />
    </View>
  );
}

function StatTile({ icon, value, labelTx }: { icon: React.ReactNode; value: number; labelTx: 'profile.streak' | 'profile.xp' | 'profile.coin' }) {
  return (
    <View className="flex-1 items-center rounded-2xl border border-neutral-200/80 bg-white p-3.5 dark:border-neutral-800 dark:bg-neutral-900">
      {icon}
      <Text className="mt-1 font-nunito text-lg font-extrabold text-mascot-navy dark:text-white">{value}</Text>
      <Text className="text-center text-[11px] font-bold tracking-wide text-neutral-400 uppercase" tx={labelTx} />
    </View>
  );
}

function ComingSoonRow({ icon, tx, last }: { icon: React.ReactNode; tx: 'profile.menu.achievements' | 'profile.menu.wallet' | 'profile.menu.inventory'; last?: boolean }) {
  return (
    <View className={`flex-row items-center p-4 ${last ? '' : 'border-b border-neutral-50 dark:border-neutral-800'}`}>
      <View className="mr-3 w-8 items-center">{icon}</View>
      <Text className="flex-1 text-base font-bold text-neutral-400" tx={tx} />
      <Text className="mr-1 text-xs font-semibold text-neutral-400" tx="profile.coming_soon" />
      <ChevronRightIcon color="#D1D5DB" width={18} height={18} />
    </View>
  );
}
