import type { LeechWord } from '@/features/study/mnemonic-api';
import { fireEvent, render, screen } from '@testing-library/react-native';
import * as React from 'react';
import { LeechWordsCard } from '../components/leech-words-card';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@/lib/i18n', () => ({
  translate: (key: string, opts?: Record<string, unknown>) => (opts ? `${key} ${JSON.stringify(opts)}` : key),
}));
jest.mock('@/components/ui', () => ({ Text: require('react-native').Text }));
jest.mock('@/components/ui/icons', () => ({ ChevronRightIcon: () => null, SparklesIcon: () => null }));
jest.mock('@/components/ui/surface', () => ({ useSurface: () => ({ textMuted: '#999' }), useColorMode: () => 'light' }));
jest.mock('@/features/study/components/mnemonic-sheet', () => ({ MnemonicSheet: () => null }));

function words(n: number): LeechWord[] {
  return Array.from({ length: n }, (_, i) => ({
    topicItemId: i + 1,
    word: `word${i + 1}`,
    meaning: null,
    forgetCount: 2,
    mnemonic: null,
  }));
}

describe('"Từ hay quên" card', () => {
  beforeEach(() => mockPush.mockClear());

  it('shows the first 8 and links to all of them, counting the ones the server did not send', () => {
    render(<LeechWordsCard items={words(20)} total={41} />);

    expect(screen.getByText('word8')).toBeOnTheScreen();
    expect(screen.queryByText('word9')).toBeNull();
    fireEvent.press(screen.getByTestId('leech-see-all'));
    expect(screen.getByText('mnemonic.leeches_see_all {"count":41}')).toBeOnTheScreen();
    expect(mockPush).toHaveBeenCalledWith('/leech-words');
  });

  it('has no link when everything fits, and the full screen lists every word', () => {
    render(<LeechWordsCard items={words(5)} total={5} />);
    expect(screen.queryByTestId('leech-see-all')).toBeNull();

    render(<LeechWordsCard items={words(30)} total={30} showAll />);
    expect(screen.getByText('word30')).toBeOnTheScreen();
    expect(screen.queryByTestId('leech-see-all')).toBeNull();
  });
});
