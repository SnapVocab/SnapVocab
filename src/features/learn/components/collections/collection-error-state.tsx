import Animated, { FadeIn } from 'react-native-reanimated';
import { Button, Mascot, Text } from '@/components/ui';
import { translate } from '@/lib/i18n';

type Props = {
  title?: string;
  description?: string;
  isRetrying?: boolean;
  onRetry?: () => void;
};

export default function CollectionErrorState({
  title,
  description,
  isRetrying = false,
  onRetry,
}: Props) {
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      className="items-center justify-center px-4 py-12"
    >
      <Mascot pose="sad" float className="size-36" />
      <Text className="mt-4 text-center font-nunito text-lg font-extrabold text-mascot-navy dark:text-white">
        {title ?? translate('learn.collections.error_title')}
      </Text>
      <Text className="mt-1 text-center font-inter text-sm text-neutral-500 dark:text-neutral-400">
        {description ?? translate('learn.collections.error_description')}
      </Text>
      {onRetry && (
        <Button
          label={translate('learn.collections.retry')}
          loading={isRetrying}
          onPress={onRetry}
          className="mt-6 px-6"
          size="default"
        />
      )}
    </Animated.View>
  );
}

export { CollectionErrorState };
