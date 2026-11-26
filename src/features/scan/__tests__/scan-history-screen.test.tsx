import { fireEvent, render, screen } from '@testing-library/react-native';
import * as React from 'react';
import { useScanHistory } from '../api';
import { ScanHistoryScreen } from '../scan-history-screen';

const mockPush = jest.fn();
const mockDismissTo = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, back: jest.fn(), dismissTo: mockDismissTo }) }));
jest.mock('../api', () => ({ useScanHistory: jest.fn() }));
jest.mock('expo-image', () => ({ Image: () => null }));
jest.mock('@/lib/i18n', () => ({ translate: (key: string) => key, getLanguage: () => 'vi' }));
jest.mock('@/components/ui/icons', () => ({ CameraIcon: () => null, ChevronRightIcon: () => null }));
jest.mock('@/components/ui/surface', () => ({ useColorMode: () => 'light' }));
jest.mock('@/components/ui', () => {
  const RN = require('react-native');
  return {
    SafeAreaView: RN.View,
    View: RN.View,
    Pressable: RN.Pressable,
    FocusAwareStatusBar: () => null,
    Mascot: () => null,
    ScreenHeader: () => null,
    Text: ({ tx, children }: { tx?: string; children?: React.ReactNode }) => <RN.Text>{tx ?? children}</RN.Text>,
    Button: ({ tx, onPress }: { tx: string; onPress: () => void }) => <RN.Pressable onPress={onPress}><RN.Text>{tx}</RN.Text></RN.Pressable>,
  };
});

function history(items: unknown[]) {
  jest.mocked(useScanHistory).mockReturnValue({
    data: { pages: [{ data: items, meta: { page: 0, pages: 1, total: items.length, size: 20 } }] },
    isPending: false,
    isError: false,
    isRefetching: false,
    isFetchingNextPage: false,
    hasNextPage: false,
  } as unknown as ReturnType<typeof useScanHistory>);
}

beforeEach(() => jest.clearAllMocks());

it('shows each scan with its words and reopens its result', () => {
  history([
    { requestId: 'r1', status: 'DONE', errorCode: null, createdAt: '2026-11-25T08:00:00Z', finishedAt: null, detectionCount: 2, words: ['cup', 'mug'], imageUrl: 'https://x/y' },
    { requestId: 'r2', status: 'PROCESSING', errorCode: null, createdAt: '2026-11-25T09:00:00Z', finishedAt: null, detectionCount: null, words: [], imageUrl: null },
  ]);
  render(<ScanHistoryScreen />);
  expect(screen.getByText('cup, mug')).toBeOnTheScreen();
  expect(screen.getByText('scan.history.in_progress')).toBeOnTheScreen();
  fireEvent.press(screen.getByTestId('scan-history-r2'));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/scan-result', params: { requestId: 'r2' } });
});

it('an empty history sends the learner back to the camera tab', () => {
  history([]);
  render(<ScanHistoryScreen />);
  fireEvent.press(screen.getByText('scan.history.scan_now'));
  expect(mockDismissTo).toHaveBeenCalledWith('/camera');
});
