import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import type { ViewStyle } from 'react-native';
import { BottomTabBar } from '@react-navigation/bottom-tabs';
import * as React from 'react';
import { I18nManager, StyleSheet, View } from 'react-native';
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { TAB_TRANSITION_DURATION } from './tab-transition';

/** Keep the native tab buttons/semantics; only the active marker travels. */
export function SlidingTabBar(props: BottomTabBarProps & { reduceMotion: boolean }) {
  const { state, descriptors, insets, reduceMotion } = props;
  const focusedOptions = descriptors[state.routes[state.index].key].options;
  const sidebar = focusedOptions.tabBarPosition === 'left' || focusedOptions.tabBarPosition === 'right';
  const barStyle = StyleSheet.flatten(focusedOptions.tabBarStyle) as ViewStyle | undefined;
  const hidden = barStyle?.display === 'none';
  const routes = state.routes.filter(route =>
    StyleSheet.flatten(descriptors[route.key].options.tabBarItemStyle)?.display !== 'none');
  const selected = routes.findIndex(route => route.key === state.routes[state.index].key);
  const [width, setWidth] = React.useState(0);
  const position = useSharedValue(Math.max(0, selected));
  const sideInset = Math.max(insets.left, insets.right);
  const count = routes.length;
  const rtl = I18nManager.isRTL;
  const slotWidth = count ? Math.max(0, width - sideInset * 2) / count : 0;

  React.useEffect(() => {
    if (selected < 0)
      return;
    position.value = withTiming(selected, {
      duration: reduceMotion ? 0 : TAB_TRANSITION_DURATION,
      easing: Easing.out(Easing.cubic),
      reduceMotion: ReduceMotion.System,
    });
  }, [selected, position, reduceMotion]);

  const indicatorStyle = useAnimatedStyle(() => {
    const index = rtl ? count - 1 - position.value : position.value;
    return { transform: [{ translateX: sideInset + (index + 0.5) * slotWidth - 20 }] };
  });

  // Camera hides the bar; the expanded navigation rail keeps its native indicator.
  if (sidebar || hidden)
    return <BottomTabBar {...props} />;

  return (
    <View
      testID="sliding-tab-bar"
      className="relative"
      onLayout={event => setWidth(event.nativeEvent.layout.width)}
    >
      <BottomTabBar {...props} />
      {width > 0 && selected >= 0 && (
        <Animated.View
          testID="active-tab-indicator"
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          className="absolute top-0 left-0 h-[3px] w-10 rounded-b-full bg-action"
          style={indicatorStyle}
        />
      )}
    </View>
  );
}
