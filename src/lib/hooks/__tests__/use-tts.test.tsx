import { act, renderHook } from '@testing-library/react-native';
import { createAudioPlayer } from 'expo-audio';
import { SLOW_PLAYBACK_RATE, TTS_LOAD_TIMEOUT_MS, useTts } from '../use-tts';

type Listener = (status: Record<string, unknown>) => void;
let mockListener: Listener = () => {};
const mockPlayer = {
  setPlaybackRate: jest.fn(),
  addListener: jest.fn((_event: string, fn: Listener) => {
    mockListener = fn;
  }),
  play: jest.fn(),
  pause: jest.fn(),
  remove: jest.fn(),
};

jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(() => mockPlayer),
  setAudioModeAsync: jest.fn(async () => {}),
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

it('plays the slow voice slower still, with pitch kept', async () => {
  const { result } = renderHook(() => useTts());
  await act(() => result.current.speak('ship', { slow: true }));
  expect(jest.mocked(createAudioPlayer).mock.calls[0]![0]).toContain('ttsspeed=0.24');
  expect(mockPlayer.setPlaybackRate).toHaveBeenCalledWith(SLOW_PLAYBACK_RATE, 'high');
  expect(mockPlayer.play).toHaveBeenCalled();
});

it('reports a failure when no sound starts in time', async () => {
  const { result } = renderHook(() => useTts());
  await act(() => result.current.speak('ship'));
  expect(result.current.isPlaying).toBe(true);
  act(() => jest.advanceTimersByTime(TTS_LOAD_TIMEOUT_MS));
  expect(result.current.failed).toBe(true);
  expect(result.current.isPlaying).toBe(false);
});

it('is not a failure once the sound started, and clears the flag on the next try', async () => {
  const { result } = renderHook(() => useTts());
  await act(() => result.current.speak('ship'));
  act(() => mockListener({ playing: true, playbackState: 'ready' }));
  act(() => jest.advanceTimersByTime(TTS_LOAD_TIMEOUT_MS));
  expect(result.current.failed).toBe(false);

  act(() => mockListener({ playing: false, didJustFinish: true, playbackState: 'ended' }));
  expect(result.current.isPlaying).toBe(false);
});
