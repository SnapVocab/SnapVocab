import { router } from 'expo-router';
import { ScrollView } from 'react-native';
import { FocusAwareStatusBar, ListItem, SafeAreaView, Text, View } from '@/components/ui';
import { InventoryIcon, ShoppingBagIcon, TrophyIcon, WalletIcon } from '@/components/ui/icons';
import { EditButton } from './components/edit-button';
import { ProfileCard } from './components/profile-card';
import { SettingsButton } from './components/settings-button';

export function ProfileScreen() {
  return (
    <View className="flex-1 bg-white dark:bg-neutral-900">
      <SafeAreaView className="flex-1">
        <FocusAwareStatusBar />

        <View className="flex-row items-center justify-between border-b border-gray-200 bg-white px-5 py-3 dark:border-neutral-700 dark:bg-neutral-900">
          <Text className="text-3xl font-black">Profile</Text>
          <View className="flex-row gap-2">
            <EditButton onPress={() => router.push('/edit-profile')} />
            <SettingsButton />
          </View>
        </View>

        <ScrollView className="bg-gray-100" contentContainerStyle={{ paddingBottom: 100 }}>
          <View className="min-h-175 px-5 pt-5">
            <ProfileCard />
            <View className="gap-1">
              <ListItem
                icon={TrophyIcon}
                label="Achievements"
                bgColor="#FFEECD"
                iconColor="#F4A429"
              />
              <ListItem
                icon={WalletIcon}
                label="Coin Wallet"
                bgColor="#D8F8DD"
                iconColor="#29C45C"
              />
              <ListItem icon={ShoppingBagIcon} label="Shop" bgColor="#FFE4EB" iconColor="#F7357F" />
              <ListItem
                icon={InventoryIcon}
                label="Inventory"
                bgColor="#D5F4FF"
                iconColor="#00A6E5"
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
