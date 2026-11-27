import { Redirect, useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

import {
  Button,
  FocusAwareStatusBar,
  Image,
  SafeAreaView,
  Text,
} from '@/components/ui';
import { translate } from '@/lib/i18n/utils';
import { hasSeenWelcome, markWelcomeSeen } from './seen';

export function WelcomeScreen() {
  // Read once on mount: marking it seen below must not redirect away mid-onboarding.
  const [seenBefore] = React.useState(hasSeenWelcome);
  if (seenBefore)
    return <Redirect href="/(auth)/login" />;
  return <Onboarding />;
}

function Onboarding() {
  const slides = [{
    image: require('@assets/images/snapy-welcome.png'),
    title: translate('welcome.title1'),
    subtitle: translate('welcome.subtitle1'),
    bg: 'from-primary/10 to-pink/10',
  }, {
    image: require('@assets/images/snapy-snap.png'),
    title: translate('welcome.title2'),
    subtitle: translate('welcome.subtitle2'),
    bg: 'from-primary/10 to-success/10',
  }, {
    image: require('@assets/images/snapy-reading.png'),
    title: translate('welcome.title3'),
    subtitle: translate('welcome.subtitle3'),
    bg: 'from-warning/10 to-primary/10',
  }];

  const router = useRouter();
  const [index, setIndex] = React.useState(0);
  const last = index === slides.length - 1;
  const slide = slides[index];
  // Leaving the slides, by any button, marks them seen.
  const finish = (to: '/(auth)/login' | '/(auth)/register') => {
    markWelcomeSeen();
    router.replace(to);
  };
  // A swipe past the last slide does nothing: the learner picks Register or Login there.
  const next = () => setIndex(i => Math.min(slides.length - 1, i + 1));
  const prev = () => setIndex(i => Math.max(0, i - 1));

  const swipe = Gesture.Pan()
    .onEnd((event) => {
      if (event.translationX < -50)
        runOnJS(next)();
      else if (event.translationX > 50)
        runOnJS(prev)();
    });

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-background">
      <FocusAwareStatusBar />

      <View className="h-12 flex-row items-center justify-end px-4">
        {!last && (
          <Pressable
            accessibilityRole="button"
            onPress={() => finish('/(auth)/login')}
            hitSlop={8}
            testID="welcome-skip"
            className="min-h-11 justify-center rounded-xl px-3 active:bg-pressed"
          >
            <Text className="font-nunito text-sm font-bold text-neutral-500 dark:text-neutral-300">{translate('welcome.skip')}</Text>
          </Pressable>
        )}
      </View>

      <GestureDetector gesture={swipe}>
        <View className="flex-1 items-center justify-center px-6">
          {/* Avatar / Image Container */}
          <View className="relative mb-12 items-center justify-center">
            {/* Main Circle */}
            <View className="size-72 items-center justify-center rounded-full bg-white shadow-xl shadow-neutral-200 dark:bg-neutral-800 dark:shadow-none">
              <Image
                source={slide.image}
                alt={slide.title}
                placeholder={null}
                cachePolicy="memory-disk"
                className={`flex aspect-square w-full max-w-[18rem] items-center justify-center rounded-[2.5rem] bg-linear-to-br ${slide.bg} p-6`}
                contentFit="contain"
              />
            </View>

          </View>

          {/* Typography */}
          <View className="w-full items-center">
            <Text className="mb-4 text-center text-[28px] leading-tight font-bold text-neutral-900 dark:text-white">{slide.title}</Text>
            <Text className="px-4 text-center text-base/relaxed text-neutral-500 dark:text-neutral-400">{slide.subtitle}</Text>
          </View>
        </View>
      </GestureDetector>

      {/* Bottom Action Buttons */}
      <View className="w-full gap-3 px-6 pt-4 pb-8">
        <View className="mb-6 flex-row items-center justify-center gap-2">
          {slides.map((item, i) => (
            <View
              key={item.title}
              className={`h-2 rounded-full ${
                i === index ? 'w-7 bg-brand' : 'w-2 bg-edge'
              }`}
            />
          ))}
        </View>

        {last
          ? (
              <>
                <Button
                  label={translate('welcome.register')}
                  size="lg"
                  variant="brand"
                  className="w-full rounded-2xl"
                  onPress={() => finish('/(auth)/register')}
                  testID="welcome-register"
                />
                <Button
                  label={translate('welcome.have_account')}
                  size="lg"
                  variant="white"
                  className="w-full rounded-2xl"
                  onPress={() => finish('/(auth)/login')}
                  testID="welcome-login"
                />
              </>
            )
          : (
              <Button
                label={translate('welcome.next')}
                size="lg"
                variant="brand"
                className="w-full rounded-2xl"
                onPress={next}
                testID="welcome-next"
              />
            )}
      </View>

    </SafeAreaView>
  );
}
