import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { TopicItemData } from './types';
import { useRouter } from 'expo-router';
import * as React from 'react';

export function useTopicItemOptions(
  topicId: number | null,
  topicName: string,
  collectionId: string,
) {
  const router = useRouter();
  const [selectedItem, setSelectedItem] = React.useState<TopicItemData | null>(null);
  const itemOptionsBottomSheetRef = React.useRef<BottomSheetModal>(null);

  const handleTopicItemOptionsPress = React.useCallback((item: TopicItemData) => {
    setSelectedItem(item);
    requestAnimationFrame(() => itemOptionsBottomSheetRef.current?.present());
  }, []);

  const handleEditTopicItem = React.useCallback((item: TopicItemData) => {
    if (topicId === null) {
      return;
    }
    router.push({
      pathname: '/(app)/collections/add-word' as any,
      params: {
        topicId: String(topicId),
        topicName,
        collectionId,
        itemId: String(item.topicItemId),
      },
    });
  }, [collectionId, router, topicId, topicName]);

  return {
    itemOptionsBottomSheetRef,
    selectedItem,
    handleTopicItemOptionsPress,
    handleEditTopicItem,
  };
}
