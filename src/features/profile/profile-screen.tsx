import { router } from 'expo-router';
import { ScrollView } from 'react-native-gesture-handler';
import { FocusAwareStatusBar, SafeAreaView, Text, View } from '@/components/ui';
import { EditButton } from './components/edit-button';
import { ProfileCard } from './components/profile-card';
import { SettingsButton } from './components/settings-button';

export function ProfileScreen() {
  return (
    <SafeAreaView className="flex-1 bg-neutral-200 dark:bg-neutral-900">
      <FocusAwareStatusBar />

      <View className="flex-row justify-between p-5">
        <Text className="text-3xl font-black">Profile</Text>
        <View className="flex-row gap-2">
          <EditButton onPress={() => router.push('/edit-profile')} />
          <SettingsButton />
        </View>
      </View>
      <ScrollView className="px-5" contentContainerStyle={{ paddingBottom: 100 }}>
        <ProfileCard />
      </ScrollView>
    </SafeAreaView>
  );
}
