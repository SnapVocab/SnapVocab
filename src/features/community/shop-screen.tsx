import { FocusAwareStatusBar, SafeAreaView, Text, View } from '@/components/ui';
import { ShoppingBagIcon, SparklesIcon } from '@/components/ui/icons';
import { translate } from '@/lib/i18n';

export function ShopScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-background">
      <FocusAwareStatusBar />
      <View className="flex-1 px-5 pt-6">
        <Text className="font-nunito text-3xl font-black text-mascot-navy dark:text-white">
          {translate('shop.title')}
        </Text>
        <Text className="mt-1 font-inter text-sm text-neutral-500 dark:text-neutral-400">
          {translate('shop.subtitle')}
        </Text>

        <View className="mt-6 items-center rounded-3xl border-2 border-b-[5px] border-neutral-200 border-b-neutral-300 bg-white px-6 py-10 dark:border-neutral-700 dark:border-b-neutral-800 dark:bg-neutral-900">
          <View className="relative size-20 items-center justify-center rounded-3xl border-2 border-b-4 border-amber-200 border-b-amber-300 bg-amber-50 dark:border-amber-800 dark:border-b-amber-900 dark:bg-amber-950/50">
            <ShoppingBagIcon width={34} height={34} color="#D97706" />
            <View className="absolute -top-2 -right-2 size-8 items-center justify-center rounded-full border-2 border-b-[3px] border-amber-300 border-b-amber-400 bg-white dark:bg-neutral-900">
              <SparklesIcon width={15} height={15} color="#F59E0B" />
            </View>
          </View>
          <Text className="mt-5 text-center font-nunito text-xl font-black text-mascot-navy dark:text-white">
            {translate('shop.coming_title')}
          </Text>
          <Text className="mt-2 max-w-xs text-center font-inter text-sm/5 text-neutral-500 dark:text-neutral-400">
            {translate('shop.coming_description')}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default ShopScreen;
