import Animated, { FadeIn } from 'react-native-reanimated';
import { Mascot, Text } from '@/components/ui';
import { translate } from '@/lib/i18n';

type Props = {
  title?: string;
  description?: string;
};

export default function CollectionEmptyState({ title, description }: Props) {
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      className="items-center justify-center px-4 py-12"
    >
      <Mascot pose="read" float className="size-36" />
      <Text className="mt-4 text-center font-nunito text-lg font-extrabold text-mascot-navy dark:text-white">
        {title ?? translate('learn.collections.empty_title')}
      </Text>
      <Text className="mt-1 text-center font-inter text-sm text-neutral-500 dark:text-neutral-400">
        {description ?? translate('learn.collections.empty_description')}
      </Text>
    </Animated.View>
  );
}

export { CollectionEmptyState };
