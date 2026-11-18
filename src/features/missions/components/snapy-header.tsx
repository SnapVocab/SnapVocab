import * as React from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { Text } from '@/components/ui';
import { ChevronLeftIcon } from '@/components/ui/icons';
import { RewardIcon } from '@/components/ui/rewards';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { translate } from '@/lib/i18n';

export type WalletDelta = {
  coin: number;
  xp: number;
  seq: number;
};

type SnapyHeaderProps = {
  tone: 'default' | 'victory' | 'expired';
  onBack: () => void;
  delta?: WalletDelta | null;
  compact?: boolean;
};

const TONE_BG = {
  default: 'bg-[#1E2A44]',
  victory: 'bg-[#142F29]',
  expired: 'bg-[#2C3445]',
} as const;

export function SnapyHeader({ tone, onBack, delta, compact = false }: SnapyHeaderProps) {
  const coin = useAuthStore(s => s.user?.coin);
  const exp = useAuthStore(s => s.user?.exp);
  const reducedMotion = useReducedMotion();

  const coinScale = useSharedValue(1);
  const xpScale = useSharedValue(1);

  React.useEffect(() => {
    if (!delta || reducedMotion)
      return;
    if (delta.coin > 0) {
      coinScale.value = withSequence(
        withTiming(1.13, { duration: 140 }),
        withTiming(1, { duration: 260 }),
      );
    }
    if (delta.xp > 0) {
      xpScale.value = withSequence(
        withTiming(1.13, { duration: 140 }),
        withTiming(1, { duration: 260 }),
      );
    }
  }, [coinScale, delta, reducedMotion, xpScale]);

  const coinAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: coinScale.value }],
  }));
  const xpAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: xpScale.value }],
  }));

  const showCoinPop = Boolean(delta && delta.coin > 0);
  const showXpPop = Boolean(delta && delta.xp > 0);

  return (
    <View
      className={`z-20 h-[54px] flex-row items-center gap-2 border-b border-white/10 px-3.5 ${TONE_BG[tone]}`}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={translate('missions.back')}
        onPress={onBack}
        hitSlop={12}
        className="-ml-1 size-9 items-center justify-center rounded-full active:bg-white/10"
      >
        <ChevronLeftIcon width={22} height={22} color="#FFFFFF" />
      </Pressable>

      <Text
        numberOfLines={1}
        className={`flex-1 font-nunito font-black text-white ${compact ? 'text-[14.5px]' : 'text-[16.5px]'}`}
      >
        {translate('missions.title')}
      </Text>

      <View className="flex-row items-center gap-1.5">
        {typeof coin === 'number' && (
          <View className="relative">
            <Animated.View
              testID="missions-wallet-coin"
              style={coinAnimStyle}
              className={`flex-row items-center gap-1 rounded-full border ${
                showCoinPop
                  ? 'border-[#FEF08A] bg-reward-500'
                  : 'border-[#FFD666]/45 bg-reward-500/20'
              } ${compact ? 'px-2 py-0.5' : 'px-2.5 py-1'}`}
            >
              <RewardIcon type="coin" size={14} />
              <Text
                className={`font-nunito font-black ${compact ? 'text-[11.5px]' : 'text-[12.5px]'} ${
                  showCoinPop ? 'text-[#3D2800]' : 'text-[#FFE596]'
                }`}
              >
                {coin}
              </Text>
            </Animated.View>
            {showCoinPop && delta && (
              <View
                testID="missions-wallet-coin-delta"
                className="absolute right-0 -bottom-4 rounded-full bg-primary-800 px-1.5 py-0.5"
              >
                <Text className="font-nunito text-[10px] font-black text-white">{`+${delta.coin}`}</Text>
              </View>
            )}
          </View>
        )}

        {typeof exp === 'number' && (
          <View className="relative">
            <Animated.View
              testID="missions-wallet-xp"
              style={xpAnimStyle}
              className={`flex-row items-center gap-1 rounded-full border ${
                showXpPop
                  ? 'border-[#BFDBFE] bg-[#3B82F6]'
                  : 'border-[#93C5FD]/45 bg-[#60A5FA]/20'
              } ${compact ? 'px-2 py-0.5' : 'px-2.5 py-1'}`}
            >
              <RewardIcon type="xp" size={14} />
              <Text
                className={`font-nunito font-black ${compact ? 'text-[11.5px]' : 'text-[12.5px]'} ${
                  showXpPop ? 'text-white' : 'text-[#DBEAFE]'
                }`}
              >
                {exp}
              </Text>
            </Animated.View>
            {showXpPop && delta && (
              <View
                testID="missions-wallet-xp-delta"
                className="absolute right-0 -bottom-4 rounded-full bg-[#1D4ED8] px-1.5 py-0.5"
              >
                <Text className="font-nunito text-[10px] font-black text-white">{`+${delta.xp} XP`}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
