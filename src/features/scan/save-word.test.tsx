import { fireEvent, render, screen } from '@testing-library/react-native';
import * as React from 'react';
import { useCollections, useCollectionTopics } from '@/features/learn/api';
import { targetWordField } from '@/features/learn/components/add-word/add-word-helpers';
import { SaveWordScreen } from './save-word-screen';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, push: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({ word: 'mug', scanRequestId: 'scan-1' }),
}));
jest.mock('@/features/learn/api', () => ({ useCollections: jest.fn(), useCollectionTopics: jest.fn() }));
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
    Button: ({ tx, onPress }: { tx: string; onPress: () => void }) => <RN.Pressable onPress={onPress}><RN.Text>{tx}</RN.Text></RN.Pressable>,
  };
});
jest.mock('@/components/ui/icons', () => ({ ChevronRightIcon: () => null }));

describe('saving a scanned word', () => {
  it('opens the add-word form on the picked topic with the word and the scan id', () => {
    jest.mocked(useCollections).mockReturnValue({ data: [{ id: 7, name: 'Của tôi', type: 'USER' }], isPending: false, isError: false } as unknown as ReturnType<typeof useCollections>);
    jest.mocked(useCollectionTopics).mockReturnValue({ data: { data: [{ id: 42, name: 'Nhà bếp' }] }, isPending: false } as unknown as ReturnType<typeof useCollectionTopics>);
    render(<SaveWordScreen />);
    fireEvent.press(screen.getByTestId('scan-save-topic-42'));
    expect(mockReplace).toHaveBeenCalledWith({
      pathname: '/collections/add-word',
      params: { topicId: '42', topicName: 'Nhà bếp', word: 'mug', scanRequestId: 'scan-1' },
    });
  });

  it('points a learner without a collection of their own to the Learn tab', () => {
    jest.mocked(useCollections).mockReturnValue({ data: [], isPending: false, isError: false } as unknown as ReturnType<typeof useCollections>);
    render(<SaveWordScreen />);
    expect(screen.getByText('scan.save.empty')).toBeTruthy();
  });

  it('prefills the "word" attribute, else the first required text field', () => {
    const attr = (name: string, position: number, required = false) => ({ attributeId: position, name, label: name, dataType: 'TEXT' as const, required, position });
    const group = (name: string, attributes: ReturnType<typeof attr>[], multiple = false) => ({ groupId: 1, name, label: name, multiple, position: 0, attributes });
    expect(targetWordField({ topicId: 1, groups: [group('main', [attr('phonetic', 1), attr('word', 0, true)])] })).toEqual({ group: 'main', attribute: 'word' });
    expect(targetWordField({ topicId: 1, groups: [group('main', [attr('note', 1), attr('term', 0, true)])] })).toEqual({ group: 'main', attribute: 'term' });
    expect(targetWordField({ topicId: 1, groups: [group('examples', [attr('content', 0, true)], true)] })).toBeNull();
  });
});
