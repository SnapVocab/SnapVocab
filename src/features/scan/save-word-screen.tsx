import type { Collection } from '@/features/learn/types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView } from 'react-native';
import { BackButton, Button, FocusAwareStatusBar, Pressable, SafeAreaView, Text, View } from '@/components/ui';
import { ChevronRightIcon } from '@/components/ui/icons';
import { useCollections, useCollectionTopics } from '@/features/learn/api';
import { translate } from '@/lib/i18n';

type Params = { word: string; scanRequestId: string };

/**
 * Step 2 of saving a scanned word: pick one of the learner's own topics, then the usual add-word form opens with the
 * word looked up. The scan id rides along so the Scan daily mission can credit it (daily_mission.md §6.1).
 */
export function SaveWordScreen() {
  const router = useRouter();
  const { word, scanRequestId } = useLocalSearchParams<Params>();
  const collections = useCollections({ type: 'USER' });
  const pick = (topicId: number, topicName: string) => router.replace({
    pathname: '/collections/add-word',
    params: { topicId: String(topicId), topicName, word, scanRequestId },
  });

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-neutral-50 dark:bg-neutral-950">
      <FocusAwareStatusBar />
      <View className="flex-row items-center gap-2 px-4 pt-1 pb-3">
        <BackButton onPress={() => router.back()} />
        <View className="flex-1">
          <Text className="font-nunito text-lg font-black text-mascot-navy dark:text-white" tx="scan.save.title" />
          <Text numberOfLines={1} className="text-xs font-semibold text-neutral-500">{translate('scan.save.word', { word })}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {collections.isPending && <ActivityIndicator />}
        {collections.isError && (
          <View className="gap-2 rounded-2xl bg-white p-4 dark:bg-neutral-900">
            <Text tx="scan.save.load_error" />
            <Button tx="scan.result.retry" onPress={() => void collections.refetch()} />
          </View>
        )}
        {collections.data?.length === 0 && (
          <View className="gap-3 rounded-2xl bg-white p-4 dark:bg-neutral-900">
            <Text tx="scan.save.empty" />
            <Button tx="scan.save.go_learn" onPress={() => router.push('/learn')} />
          </View>
        )}
        {collections.data?.map(c => <CollectionTopics key={c.id} collection={c} onPick={pick} />)}
      </ScrollView>
    </SafeAreaView>
  );
}

function CollectionTopics({ collection, onPick }: { collection: Collection; onPick: (id: number, name: string) => void }) {
  // ponytail: root topics, first 50; a learner with deeper or longer trees picks from the Learn tab instead.
  const topics = useCollectionTopics(collection.id, { size: 50 });
  const items = topics.data?.data ?? [];
  return (
    <View className="gap-2">
      <Text className="font-nunito text-sm font-extrabold text-neutral-500">{collection.name}</Text>
      {topics.isPending && <ActivityIndicator />}
      {!topics.isPending && items.length === 0 && <Text className="text-sm text-neutral-400" tx="scan.save.no_topics" />}
      {items.map(topic => (
        <Pressable
          key={topic.id}
          accessibilityRole="button"
          testID={`scan-save-topic-${topic.id}`}
          onPress={() => onPick(topic.id, topic.name)}
          className="min-h-12 flex-row items-center rounded-2xl bg-white px-4 py-3 active:opacity-70 dark:bg-neutral-900"
        >
          <Text numberOfLines={1} className="flex-1 font-nunito text-base font-bold text-mascot-navy dark:text-white">{topic.name}</Text>
          <ChevronRightIcon width={16} height={16} color="#9CA3AF" />
        </Pressable>
      ))}
    </View>
  );
}
