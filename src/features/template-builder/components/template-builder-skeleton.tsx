import * as React from 'react';
import { Animated, ScrollView, View } from 'react-native';
import { FocusAwareStatusBar, SafeAreaView } from '@/components/ui';

export function TemplateBuilderSkeleton() {
  const pulseAnim = React.useRef(new Animated.Value(0.4)).current;

  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.85,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-slate-50 dark:bg-neutral-900">
      <FocusAwareStatusBar />

      {/* Header Skeleton */}
      <View className="flex-row items-center justify-between border-b border-neutral-200/80 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
        <View className="flex-row items-center gap-3">
          <Animated.View
            style={{ opacity: pulseAnim }}
            className="size-9 rounded-full bg-neutral-200 dark:bg-neutral-800"
          />
          <View className="gap-1.5">
            <Animated.View
              style={{ opacity: pulseAnim }}
              className="h-4 w-32 rounded-md bg-neutral-200 dark:bg-neutral-800"
            />
            <Animated.View
              style={{ opacity: pulseAnim }}
              className="h-2.5 w-20 rounded-md bg-neutral-200/60 dark:bg-neutral-800/60"
            />
          </View>
        </View>
        <Animated.View
          style={{ opacity: pulseAnim }}
          className="h-8 w-20 rounded-xl bg-neutral-200 dark:bg-neutral-800"
        />
      </View>

      {/* Segmented Tab Bar Skeleton */}
      <View className="px-4 pt-3 pb-2">
        <View className="flex-row rounded-2xl bg-neutral-200/70 p-1 dark:bg-neutral-800">
          <Animated.View
            style={{ opacity: pulseAnim }}
            className="h-10 flex-1 rounded-xl bg-white shadow-sm dark:bg-neutral-700"
          />
          <Animated.View
            style={{ opacity: pulseAnim }}
            className="h-10 flex-1 rounded-xl bg-transparent"
          />
        </View>
      </View>

      {/* Canvas Section Cards Skeleton */}
      <ScrollView className="flex-1 px-4 pt-2" showsVerticalScrollIndicator={false}>
        {/* Section Card 1 */}
        <View className="mb-4 rounded-3xl border border-neutral-200/80 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          {/* Section Header */}
          <View className="mb-3 flex-row items-center justify-between border-b border-neutral-100 pb-3 dark:border-neutral-800">
            <View className="flex-row items-center gap-2">
              <Animated.View
                style={{ opacity: pulseAnim }}
                className="size-5 rounded-md bg-neutral-200 dark:bg-neutral-800"
              />
              <Animated.View
                style={{ opacity: pulseAnim }}
                className="h-4 w-28 rounded-md bg-neutral-200 dark:bg-neutral-800"
              />
            </View>
            <Animated.View
              style={{ opacity: pulseAnim }}
              className="size-7 rounded-full bg-neutral-100 dark:bg-neutral-800"
            />
          </View>

          {/* Field Items */}
          <View className="gap-2.5">
            <Animated.View
              style={{ opacity: pulseAnim }}
              className="h-14 rounded-2xl border border-neutral-200/60 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800/40"
            />
            <View className="flex-row gap-2.5">
              <Animated.View
                style={{ opacity: pulseAnim }}
                className="h-14 flex-1 rounded-2xl border border-neutral-200/60 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800/40"
              />
              <Animated.View
                style={{ opacity: pulseAnim }}
                className="h-14 flex-1 rounded-2xl border border-neutral-200/60 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800/40"
              />
            </View>

            {/* Add Field Placeholder */}
            <Animated.View
              style={{ opacity: pulseAnim }}
              className="h-10 rounded-xl border border-dashed border-neutral-300/80 bg-neutral-50/50 dark:border-neutral-700/60 dark:bg-neutral-800/20"
            />
          </View>
        </View>

        {/* Section Card 2 */}
        <View className="mb-4 rounded-3xl border border-neutral-200/80 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <View className="mb-3 flex-row items-center justify-between border-b border-neutral-100 pb-3 dark:border-neutral-800">
            <View className="flex-row items-center gap-2">
              <Animated.View
                style={{ opacity: pulseAnim }}
                className="size-5 rounded-md bg-neutral-200 dark:bg-neutral-800"
              />
              <Animated.View
                style={{ opacity: pulseAnim }}
                className="h-4 w-24 rounded-md bg-neutral-200 dark:bg-neutral-800"
              />
            </View>
            <Animated.View
              style={{ opacity: pulseAnim }}
              className="size-7 rounded-full bg-neutral-100 dark:bg-neutral-800"
            />
          </View>

          <View className="gap-2.5">
            <Animated.View
              style={{ opacity: pulseAnim }}
              className="h-14 rounded-2xl border border-neutral-200/60 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800/40"
            />
          </View>
        </View>

        {/* Add Section Placeholder */}
        <Animated.View
          style={{ opacity: pulseAnim }}
          className="mb-8 h-12 rounded-2xl border border-dashed border-emerald-300/60 bg-emerald-50/30 dark:border-emerald-800/40 dark:bg-emerald-950/10"
        />
      </ScrollView>

      {/* Bottom Save Button Skeleton */}
      <View className="border-t border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <Animated.View
          style={{ opacity: pulseAnim }}
          className="h-12 w-full rounded-2xl bg-neutral-200 dark:bg-neutral-800"
        />
      </View>
    </SafeAreaView>
  );
}
