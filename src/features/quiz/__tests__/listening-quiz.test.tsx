import type { QuizPlayDTO } from '../types';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as React from 'react';
import { ttsUrl } from '@/lib/hooks/use-tts';
import i18n from '@/lib/i18n';
import { MultipleChoiceQuizView } from '../components/multiple-choice-quiz-view';
import { hasDirection } from '../screens/quiz-setup-screen';

const mockSpeak = jest.fn();
const mockMutate = jest.fn();
let mockFailed = false;

jest.mock('expo-audio', () => ({ createAudioPlayer: jest.fn(), setAudioModeAsync: jest.fn() }));
jest.mock('@/lib/hooks/use-tts', () => ({
  ...jest.requireActual('@/lib/hooks/use-tts'),
  useTts: () => ({ speak: mockSpeak, stop: jest.fn(), isPlaying: false, failed: mockFailed }),
}));
jest.mock('@/components/ui/snapy', () => ({ Snapy: () => null }));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: require('react-native').View }));
jest.mock('../api/quiz-api', () => ({
  useCheckQuestion: () => ({ mutate: mockMutate, isPending: false }),
  useCancelQuiz: () => ({ mutate: jest.fn(), isPending: false }),
}));
jest.mock('../hooks/use-finish-quiz', () => ({ useFinishQuiz: () => ({ finish: jest.fn(), isPending: false }) }));
jest.mock('../hooks/use-expired-session-handler', () => ({ useExpiredSessionHandler: () => () => false }));

const quiz: QuizPlayDTO = {
  quizId: 7,
  status: 'IN_PROGRESS',
  mode: 'LISTENING',
  direction: null,
  topicId: 1,
  topicName: 'Travel',
  requestedCount: 5,
  matchingRounds: [],
  questions: [{
    questionId: 70,
    position: 1,
    prompt: 'ship',
    outcome: 'UNCOMMITTED',
    resolved: false,
    options: [
      { key: 'o1', label: 'chip', displayOrder: 1 },
      { key: 'o2', label: 'ship', displayOrder: 2 },
      { key: 'o3', label: 'shop', displayOrder: 3 },
      { key: 'o4', label: 'sheep', displayOrder: 4 },
    ],
  }],
};

const renderQuiz = () => render(<MultipleChoiceQuizView quiz={quiz} onExit={jest.fn()} onResync={jest.fn()} />);

beforeAll(async () => {
  await i18n.changeLanguage('vi');
});

beforeEach(() => {
  jest.clearAllMocks();
  mockFailed = false;
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('listening quiz', () => {
  it('plays the word by itself and keeps it hidden until answered', () => {
    renderQuiz();
    expect(screen.getByText('Nghe và chọn từ đúng')).toBeOnTheScreen();
    expect(screen.queryByTestId('listening-word')).toBeNull();
    expect(mockSpeak).not.toHaveBeenCalled();

    act(() => jest.advanceTimersByTime(1300));
    expect(mockSpeak).toHaveBeenCalledWith('ship', { lang: 'en' });
  });

  it('replays normally or slowly on demand', () => {
    renderQuiz();
    fireEvent.press(screen.getByTestId('listening-play'));
    expect(mockSpeak).toHaveBeenLastCalledWith('ship', { lang: 'en' });
    fireEvent.press(screen.getByTestId('listening-play-slow'));
    expect(mockSpeak).toHaveBeenLastCalledWith('ship', { lang: 'en', slow: true });
  });

  it('reveals the word and its meaning once graded', () => {
    renderQuiz();
    fireEvent.press(screen.getByText('chip'));
    fireEvent.press(screen.getByText('Kiểm tra'));
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ questionId: 70, data: { optionKey: 'o1' } }),
      expect.any(Object),
    );

    act(() => mockMutate.mock.calls[0][1].onSuccess({
      questionId: 70,
      outcome: 'INCORRECT',
      correct: false,
      correctAnswer: 'ship',
      correctOptionKey: 'o2',
      meaning: 'con tàu',
    }));
    expect(screen.getByTestId('listening-word')).toHaveTextContent('ship');
    expect(screen.getByText('con tàu')).toBeOnTheScreen();
  });

  it('lets the learner show the word when no sound plays', () => {
    mockFailed = true;
    renderQuiz();
    expect(screen.getByText('Không phát được âm thanh. Kiểm tra mạng rồi thử lại.')).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId('listening-show-word'));
    expect(screen.getByTestId('listening-word')).toHaveTextContent('ship');
  });
});

describe('listening setup and voice', () => {
  it('has no EN/VI direction to pick', () => {
    expect(hasDirection('LISTENING')).toBe(false);
    expect(hasDirection('FILL_BLANK')).toBe(false);
    expect(hasDirection('MCQ')).toBe(true);
  });

  it('asks Google for its slow voice only when slow', () => {
    expect(ttsUrl('look after', 'en')).toContain('q=look%20after');
    expect(ttsUrl('ship', 'en')).not.toContain('ttsspeed');
    expect(ttsUrl('ship', 'en', true)).toContain('ttsspeed=0.24');
  });
});
