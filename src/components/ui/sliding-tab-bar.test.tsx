import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { fireEvent, render, screen } from '@testing-library/react-native';
import * as React from 'react';
import { StyleSheet } from 'react-native';
import { SlidingTabBar } from './sliding-tab-bar';

const mockTiming = jest.fn((value: number, _config: unknown) => value);
jest.mock('@react-navigation/bottom-tabs', () => ({
  BottomTabBar: () => require('react').createElement(require('react-native').View, { testID: 'native-tab-bar' }),
}));
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { View: require('react-native').View },
  Easing: { out: (easing: unknown) => easing, cubic: (value: number) => value },
  ReduceMotion: { System: 'system' },
  useSharedValue: (value: number) => require('react').useRef({ value }).current,
  useAnimatedStyle: (callback: () => unknown) => callback(),
  withTiming: (value: number, config: unknown) => mockTiming(value, config),
}));

function tabProps(selected = 0): BottomTabBarProps {
  const routes = ['index', 'learn', 'camera', 'shop', 'community', 'profile']
    .map(name => ({ key: name, name }));
  return {
    state: { key: 'tabs', index: selected, routes, routeNames: routes.map(route => route.name), type: 'tab' },
    descriptors: Object.fromEntries(routes.map(route => [route.key, {
      options: {
        tabBarItemStyle: route.name === 'community' ? { display: 'none' } : {},
        tabBarStyle: route.name === 'camera' ? { display: 'none' } : {},
      },
    }])),
    insets: { top: 0, bottom: 24, left: 0, right: 0 },
    navigation: {},
  } as BottomTabBarProps;
}

beforeEach(() => mockTiming.mockClear());

it('aligns the marker with Profile while excluding the hidden Community tab', () => {
  render(<SlidingTabBar {...tabProps(5)} reduceMotion={false} />);
  fireEvent(screen.getByTestId('sliding-tab-bar'), 'layout', { nativeEvent: { layout: { width: 400 } } });
  expect(StyleSheet.flatten(screen.getByTestId('active-tab-indicator', { includeHiddenElements: true }).props.style).transform)
    .toEqual([{ translateX: 340 }]);

  fireEvent(screen.getByTestId('sliding-tab-bar'), 'layout', { nativeEvent: { layout: { width: 500 } } });
  expect(StyleSheet.flatten(screen.getByTestId('active-tab-indicator', { includeHiddenElements: true }).props.style).transform)
    .toEqual([{ translateX: 430 }]);
});

it('retargets the marker to the actual navigation selection during rapid changes', () => {
  const view = render(<SlidingTabBar {...tabProps()} reduceMotion={false} />);
  view.rerender(<SlidingTabBar {...tabProps(1)} reduceMotion={false} />);
  view.rerender(<SlidingTabBar {...tabProps(3)} reduceMotion={false} />);
  expect(mockTiming).toHaveBeenLastCalledWith(3, expect.objectContaining({ duration: 240 }));
});

it('keeps Camera and the expanded native rail free of the phone marker', () => {
  const view = render(<SlidingTabBar {...tabProps(2)} reduceMotion={false} />);
  expect(screen.getByTestId('native-tab-bar')).toBeTruthy();
  expect(screen.queryByTestId('sliding-tab-bar')).toBeNull();
  const rail = tabProps();
  rail.descriptors.index.options.tabBarPosition = 'left';
  view.rerender(<SlidingTabBar {...rail} reduceMotion={false} />);
  expect(screen.queryByTestId('active-tab-indicator')).toBeNull();
});

it('updates instantly when the user enables Reduce Motion', () => {
  render(<SlidingTabBar {...tabProps(1)} reduceMotion />);
  expect(mockTiming).toHaveBeenLastCalledWith(1, expect.objectContaining({ duration: 0 }));
});
