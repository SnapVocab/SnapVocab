import { useRouter } from 'expo-router';
import * as React from 'react';
import { View } from 'react-native';

import {
  Button,
  FocusAwareStatusBar,
  Image,
  SafeAreaView,
  Text,
} from '@/components/ui';
import { translate } from '@/lib/i18n/utils';

export function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-[#F4F6FC] dark:bg-neutral-900">
      <FocusAwareStatusBar />

      <View className="flex-1 items-center justify-center px-6">
        {/* Avatar / Image Container */}
        <View className="relative mb-12 items-center justify-center">
          {/* Main Circle */}
          <View className="size-72 items-center justify-center rounded-full bg-white shadow-xl shadow-neutral-200 dark:bg-neutral-800 dark:shadow-none">
            <Image
              source={require('@assets/fox.png')}
              className="size-56 rounded-full"
              contentFit="contain"
            />
          </View>

          {/* "Scanned" Badge */}
          <View className="absolute top-6 -right-2 flex-row items-center rounded-xl border border-neutral-100 bg-white px-4 py-2 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
            <View className="mr-2 size-2 rounded-full bg-green-700" />
            <Text tx="welcome.scanned" className="text-sm font-medium text-neutral-800 dark:text-neutral-200" />

          </View>
        </View>

        {/* Typography */}
        <View className="w-full items-center">
          <Text tx="welcome.title" className="mb-4 text-center text-[28px] leading-tight font-bold text-neutral-900 dark:text-white" />
          <Text tx="welcome.subtitle" className="px-4 text-center text-base/relaxed text-neutral-500 dark:text-neutral-400" />
        </View>
      </View>

      {/* Bottom Action Button */}
      <View className="w-full px-6 pt-4 pb-8">
        <Button
          label={translate('welcome.get_started')}
          size="lg"
          variant="brand"
          className="w-full rounded-full"
          onPress={() => router.replace('/login')}
        />
      </View>
    </SafeAreaView>
  );
}
