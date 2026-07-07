import { ScrollView } from 'react-native';
import { FocusAwareStatusBar, SafeAreaView, Text, View } from '@/components/ui';

export function LearnScreen() {
  return (
    <View className="flex-1 bg-white dark:bg-neutral-900">
      <SafeAreaView className="flex-1">
        <FocusAwareStatusBar />

        <View className="gap-2 border-b border-gray-200 bg-white px-5 py-3 dark:border-neutral-700 dark:bg-neutral-900">
          <Text className="text-2xl font-extrabold">Learn</Text>
          <Text className="text-sm font-bold text-muted-foreground">Pick how you want to study today</Text>
        </View>

        <ScrollView className="bg-gray-100" contentContainerStyle={{ paddingBottom: 100 }}>
          <View className="min-h-175 px-5 pt-5" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
