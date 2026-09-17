import Animated, { FadeIn } from 'react-native-reanimated';
import { Mascot, Text } from '@/components/ui';
import { translate } from '@/lib/i18n';

type Props = {
  title?: string;
  description?: string;
};

export default function CollectionWordsEmpty({ title, description }: Props) {
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      className="items-center justify-center px-4 py-10"
    >
      <Mascot pose="read" float className="size-32" />
      <Text className="mt-4 text-center font-nunito text-lg font-extrabold text-mascot-navy dark:text-white">
        {title ?? translate('learn.collection_detail.empty_words_title')}
      </Text>
      <Text className="mt-1.5 text-center font-inter text-sm/relaxed text-neutral-500 dark:text-neutral-400">
        {description ?? translate('learn.collection_detail.empty_words_desc')}
      </Text>
    </Animated.View>
  );
}

export { CollectionWordsEmpty };
