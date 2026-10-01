import { useRouter } from 'expo-router';
import * as React from 'react';
import { SpeedDialFAB } from '@/components/ui';
import { BookIcon, FolderIcon } from '@/components/ui/icons';
import { translate } from '@/lib/i18n';

type Props = {
  collectionId: string;
  collectionName: string;
  currentParentId: number | null;
  currentParentName?: string;
  firstTopicId?: number | null;
  firstTopicName?: string;
};

export function CollectionDetailFAB({
  collectionId,
  collectionName,
  currentParentId,
  currentParentName,
  firstTopicId,
  firstTopicName,
}: Props) {
  const router = useRouter();

  const handleAddWord = React.useCallback(() => {
    const targetTopicId = currentParentId ?? firstTopicId ?? null;
    const targetTopicName = currentParentName ?? firstTopicName ?? '';

    if (!targetTopicId) {
      router.push({
        pathname: '/(app)/collections/create-topic' as any,
        params: {
          collectionId,
          collectionName,
          parentId: '',
        },
      });
      return;
    }

    router.push({
      pathname: '/(app)/collections/add-word' as any,
      params: {
        topicId: String(targetTopicId),
        topicName: targetTopicName,
        collectionId,
      },
    });
  }, [
    collectionId,
    collectionName,
    currentParentId,
    currentParentName,
    firstTopicId,
    firstTopicName,
    router,
  ]);

  const handleAddTopic = React.useCallback(() => {
    router.push({
      pathname: '/(app)/collections/create-topic' as any,
      params: {
        collectionId,
        collectionName,
        parentId: currentParentId !== null ? String(currentParentId) : '',
      },
    });
  }, [collectionId, collectionName, currentParentId, router]);

  return (
    <SpeedDialFAB
      actions={[
        {
          id: 'add-word',
          label: translate('learn.topic.add_word'),
          icon: <BookIcon width={20} height={20} color="#FFFFFF" />,
          bgColorClass: 'bg-emerald-600 dark:bg-emerald-500',
          onPress: handleAddWord,
        },
        {
          id: 'add-topic',
          label: currentParentId
            ? translate('learn.topic.add_subtopic')
            : translate('learn.topic.add_topic'),
          icon: <FolderIcon width={20} height={20} color="#FFFFFF" />,
          bgColorClass: 'bg-amber-500 dark:bg-amber-600',
          onPress: handleAddTopic,
        },
      ]}
    />
  );
}

export default CollectionDetailFAB;
