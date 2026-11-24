import type { PressableProps } from 'react-native';
import { useUniwind } from 'uniwind';
import colors from '@/components/ui/colors';
import { ChevronLeftIcon } from '@/components/ui/icons';
import { translate } from '@/lib/i18n';
import { Pressable } from './pressable';

type Props = Pick<PressableProps, 'onPress' | 'testID' | 'hitSlop'> & {
  className?: string;
};

/** Shared 44px back control used by pushed mobile screens; matches ScreenHeader's round back. */
export function BackButton({ onPress, testID, hitSlop = 14, className = '' }: Props) {
  const { theme } = useUniwind();
  const iconColor = theme === 'dark' ? colors.darkTheme.foreground : '#1E2A44';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={translate('quiz.btn_back')}
      onPress={onPress}
      testID={testID}
      hitSlop={hitSlop}
      className={`size-11 items-center justify-center overflow-hidden rounded-full active:bg-pressed ${className}`}
    >
      <ChevronLeftIcon width={24} height={24} color={iconColor} />
    </Pressable>
  );
}
