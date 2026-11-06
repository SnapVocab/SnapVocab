import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as React from 'react';
import { BackHandler } from 'react-native';
import { useCollections, useInfiniteCollectionTopics } from '@/features/learn/api';
import { SaveWordScreen } from './save-word-screen';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void) => require('react').useEffect(callback, [callback]),
  useRouter: () => ({ replace: mockReplace, push: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({ word: 'mug', scanRequestId: 'scan-1' }),
}));
jest.mock('@/features/learn/api', () => ({ useCollections: jest.fn(), useInfiniteCollectionTopics: jest.fn() }));
jest.mock('@/lib/i18n', () => ({ translate: (key: string) => key }));
jest.mock('@/components/ui', () => {
  const RN = require('react-native');
  return {
    SafeAreaView: RN.View,
    View: RN.View,
    Pressable: RN.Pressable,
    FocusAwareStatusBar: () => null,
    BackButton: () => null,
    Text: ({ tx, children }: { tx?: string; children?: React.ReactNode }) => <RN.Text>{tx ?? children}</RN.Text>,
    Button: ({ tx, label, onPress, testID }: { tx?: string; label?: string; onPress: () => void; testID?: string }) => <RN.Pressable testID={testID} onPress={onPress}><RN.Text>{tx ?? label}</RN.Text></RN.Pressable>,
  };
});
jest.mock('@/components/ui/icons', () => ({ ChevronRightIcon: () => null, FolderIcon: () => null, BookIcon: () => null, CheckIcon: () => null }));
jest.mock('@/components/ui/surface', () => ({ useColorMode: () => 'light' }));

describe('saving a scanned word', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    jest.mocked(useInfiniteCollectionTopics).mockReturnValue({ data: { pages: [{ data: [{ id: 42, name: 'Kitchen', activeTemplateId: 8, hasChildren: true }] }] }, isPending: false } as unknown as ReturnType<typeof useInfiniteCollectionTopics>);
  });
  it('opens the add-word form on the picked topic with the word and the scan id', () => {
    jest.mocked(useCollections).mockReturnValue({ data: [{ id: 7, name: 'Của tôi', type: 'USER' }], isPending: false, isError: false } as unknown as ReturnType<typeof useCollections>);
    render(<SaveWordScreen />);
    fireEvent.press(screen.getByTestId('save-collection-7'));
    fireEvent.press(screen.getByTestId('scan-save-topic-42'));
    expect(mockReplace).not.toHaveBeenCalled();
    fireEvent.press(screen.getByTestId('save-destination-confirm'));
    expect(mockReplace).toHaveBeenCalledWith({
      pathname: '/collections/add-word',
      params: { topicId: '42', topicName: 'Kitchen', collectionId: '7', activeTemplateId: '8', word: 'mug', scanRequestId: 'scan-1' },
    });
  });

  it('points a learner without a collection of their own to the Learn tab', () => {
    jest.mocked(useCollections).mockReturnValue({ data: [], isPending: false, isError: false } as unknown as ReturnType<typeof useCollections>);
    render(<SaveWordScreen />);
    expect(screen.getByText('scan.save.empty')).toBeTruthy();
  });

  it('browses children and keeps the parent available as a destination', () => {
    jest.mocked(useCollections).mockReturnValue({ data: [{ id: 7, name: 'Mine', type: 'USER' }], isPending: false, isError: false } as unknown as ReturnType<typeof useCollections>);
    render(<SaveWordScreen />);
    fireEvent.press(screen.getByTestId('save-collection-7'));
    fireEvent.press(screen.getByTestId('save-subtopics-42'));
    expect(useInfiniteCollectionTopics).toHaveBeenLastCalledWith(7, { parentId: 42, size: 30 });
    expect(screen.getByText('my_words.current_topic')).toBeTruthy();
  });

  it('clears the selection when browsing into another level', () => {
    jest.mocked(useCollections).mockReturnValue({ data: [{ id: 7, name: 'Mine', type: 'USER' }], isPending: false, isError: false } as unknown as ReturnType<typeof useCollections>);
    render(<SaveWordScreen />);
    fireEvent.press(screen.getByTestId('save-collection-7'));
    fireEvent.press(screen.getByTestId('scan-save-topic-42'));
    fireEvent.press(screen.getByTestId('save-subtopics-42'));
    fireEvent.press(screen.getByTestId('save-destination-confirm'));
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('android Back walks up topic and collection levels before leaving the picker', () => {
    const remove = jest.fn();
    const listener = jest.spyOn(BackHandler, 'addEventListener').mockReturnValue({ remove });
    jest.mocked(useCollections).mockReturnValue({ data: [{ id: 7, name: 'Mine', type: 'USER' }], isPending: false, isError: false } as unknown as ReturnType<typeof useCollections>);
    render(<SaveWordScreen />);
    fireEvent.press(screen.getByTestId('save-collection-7'));
    fireEvent.press(screen.getByTestId('save-subtopics-42'));
    act(() => {
      expect(listener.mock.calls.at(-1)?.[1]()).toBe(true);
    });
    expect(useInfiniteCollectionTopics).toHaveBeenLastCalledWith(7, { parentId: undefined, size: 30 });
    act(() => {
      expect(listener.mock.calls.at(-1)?.[1]()).toBe(true);
    });
    expect(screen.getByText('my_words.choose_collection')).toBeTruthy();
    expect(remove).toHaveBeenCalled();
    listener.mockRestore();
  });
});
