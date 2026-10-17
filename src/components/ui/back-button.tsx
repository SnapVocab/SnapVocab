import type { PressableProps } from 'react-native';
import { Pressable } from 'react-native';
import { useUniwind } from 'uniwind';
import colors from '@/components/ui/colors';
import { ChevronLeftIcon } from '@/components/ui/icons';
import { translate } from '@/lib/i18n';

type Props = Pick<PressableProps, 'onPress' | 'testID' | 'hitSlop'> & {
  className?: string;
};

/** Shared 40px back control used by pushed mobile screens. */
export function BackButton({ onPress, testID, hitSlop = 8, className = '' }: Props) {
  const { theme } = useUniwind();
  const iconColor = theme === 'dark' ? colors.darkTheme.foreground : '#1E2A44';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={translate('quiz.btn_back')}
      onPress={onPress}
      testID={testID}
      hitSlop={hitSlop}
      android_ripple={{ color: 'transparent' }}
      className={`size-10 items-center justify-center rounded-xl ${theme === 'dark' ? 'bg-[#292E36] active:bg-[#363B43]' : 'bg-neutral-100 active:bg-neutral-200'} ${className}`}
    >
      <ChevronLeftIcon width={20} height={20} color={iconColor} />
    </Pressable>
  );
}
