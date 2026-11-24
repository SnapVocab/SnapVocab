import type { ReactNode } from 'react';
import { View } from 'react-native';
import { translate } from '@/lib/i18n';
import { ChevronLeftIcon } from './icons';
import { Pressable } from './pressable';
import { useSurface } from './surface';
import { Text } from './text';

type ScreenHeaderProps = {
  title: string;
  /** Omit on a tab root: a tab destination has no back. */
  onBack?: () => void;
  /** Trailing actions; the title then sits left instead of centered. */
  right?: ReactNode;
};

/** Sub-screen header shared by Quiz, Missions, Progress and Shop: round 40px back, 18px title, role-token colors. */
export function ScreenHeader({ title, onBack, right }: ScreenHeaderProps) {
  const s = useSurface();
  return (
    <View
      style={{ backgroundColor: s.headerBg, borderColor: s.border }}
      className="z-10 flex-row items-center gap-2 border-b px-4 py-3"
    >
      {onBack && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={translate('missions.back')}
          onPress={onBack}
          hitSlop={14}
          className="-ml-1 size-11 items-center justify-center overflow-hidden rounded-full active:bg-pressed"
        >
          <ChevronLeftIcon width={24} height={24} color={s.text} />
        </Pressable>
      )}
      <Text
        style={{ color: s.text }}
        numberOfLines={1}
        className={`flex-1 font-nunito text-[18px] font-extrabold ${right ? '' : onBack ? 'pr-8 text-center' : 'text-center'}`}
      >
        {title}
      </Text>
      {right}
    </View>
  );
}
