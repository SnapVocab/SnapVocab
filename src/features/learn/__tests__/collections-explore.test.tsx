import { fireEvent, render, screen } from '@testing-library/react-native';
import * as React from 'react';
import { CollectionsScreen } from '../collections-screen';

let mockView: string | undefined;
const mockCollections = jest.fn((_params: { type: string }) => ({ data: [], refetch: jest.fn() }));
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ view: mockView }),
  useRouter: () => ({ push: jest.fn() }),
  useFocusEffect: jest.fn(),
}));
jest.mock('../api', () => ({ useCollections: (params: { type: string }) => mockCollections(params) }));
jest.mock('@/features/study/api', () => ({
  useCollectionStudyCounts: () => ({ data: [], refetch: jest.fn() }),
}));
jest.mock('@/components/ui', () => ({
  SafeAreaView: require('react-native').View,
  View: require('react-native').View,
  Text: require('react-native').Text,
  Button: () => null,
  FocusAwareStatusBar: () => null,
  useSurface: () => ({ headerBg: '#fff' }),
}));
jest.mock('@/lib/storage', () => ({ setItem: jest.fn() }));
jest.mock('@/lib/i18n', () => ({ translate: (key: string) => key }));
jest.mock('../components', () => ({
  CollectionCard: () => null,
  CollectionEmptyState: () => null,
  CollectionErrorState: () => null,
  CollectionHeader: () => null,
  CollectionOptionsBottomSheet: () => null,
  SkeletonCollectionList: () => null,
  CollectionSwitcher: ({ onChange }: { onChange: (type: string) => void }) => {
    const RN = require('react-native');
    return <RN.Pressable accessibilityRole="button" accessibilityLabel="Mine" onPress={() => onChange('USER')} />;
  },
}));

beforeEach(() => {
  mockCollections.mockClear();
  mockView = undefined;
});

it('opens system collections for the Home empty-state explore intent and still allows switching to Mine', () => {
  mockView = 'explore';
  render(<CollectionsScreen />);
  expect(mockCollections).toHaveBeenLastCalledWith({ type: 'SYSTEM' });
  fireEvent.press(screen.getByRole('button', { name: 'Mine' }));
  expect(mockCollections).toHaveBeenLastCalledWith({ type: 'USER' });
});

it('handles a new explore intent when the collections screen is already mounted', () => {
  const view = render(<CollectionsScreen />);
  expect(mockCollections).toHaveBeenLastCalledWith({ type: 'USER' });
  mockView = 'explore';
  view.rerender(<CollectionsScreen />);
  expect(mockCollections).toHaveBeenLastCalledWith({ type: 'SYSTEM' });
});
