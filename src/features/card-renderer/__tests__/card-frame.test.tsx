import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react-native';
import * as React from 'react';
import { Text } from 'react-native';
import { store } from '@/features/auth/use-auth-store';
import { cardFrameSize, useEquippedCardFrame } from '../card-frame';
import { FlipCardContainer } from '../components/flip-card-container';

jest.mock('@/features/profile/api', () => ({ meKey: ['me'] }));
// jest-setup's reanimated mock has no interpolate; FlipCardContainer needs it.
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { View: require('react-native').View },
  useSharedValue: (value: number) => ({ value }),
  useAnimatedStyle: (fn: () => object) => fn(),
  withTiming: (value: number) => value,
  interpolate: (_value: number, _input: number[], output: number[]) => output[0],
  runOnJS: (fn: () => void) => fn,
}));
// The shared __mocks__ points at a file the installed gesture-handler no longer ships.
jest.mock('react-native-gesture-handler', () => {
  const tap: any = new Proxy({}, { get: () => () => tap });
  return { GestureDetector: ({ children }: { children: React.ReactNode }) => children, Gesture: { Tap: () => tap } };
});

const front = <Text>front</Text>;
const back = <Text>back</Text>;
const layout = (width: number) => ({ nativeEvent: { layout: { x: 0, y: 0, width, height: 0 } } });

describe('card frame (card_frame_plan.md §3–§4)', () => {
  it('sizes a 3:4 card by width, or by height when the height runs out', () => {
    expect(cardFrameSize(300)).toEqual({ width: 300, height: 400 });
    expect(cardFrameSize(300, 320)).toEqual({ width: 240, height: 320 });
  });

  it('without a frame the card renders exactly as before (AC-CF-01)', () => {
    render(<FlipCardContainer frontContent={front} backContent={back} />);
    expect(screen.queryByTestId('card-frame-front')).toBeNull();
    expect(screen.getByText('front')).toBeTruthy();
  });

  it('frames both faces, never takes touches, and drops the frame on a load error (AC-CF-04/05/06)', () => {
    const onFrameError = jest.fn();
    const view = render(
      <FlipCardContainer frontContent={front} backContent={back} frameUrl="https://cdn/card.png" onFrameError={onFrameError} />,
    );
    fireEvent(view.root, 'layout', layout(300));

    const frontFrame = screen.getByTestId('card-frame-front');
    expect(screen.getByTestId('card-frame-back')).toBeTruthy();
    expect(frontFrame.props.pointerEvents).toBe('none');
    expect(screen.getByText('front')).toBeTruthy();

    const image = frontFrame.children[0] as any;
    act(() => image.props.onError());
    expect(onFrameError).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('card-frame-front')).toBeNull();
    expect(screen.getByText('front')).toBeTruthy(); // still learnable
  });

  it('asks for a fresh URL at most once per frame URL (AC-CF-06)', () => {
    const client = new QueryClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries').mockResolvedValue();
    act(() => store.setState({ user: { id: 1, equipped: { avatarFrameUrl: null, cardFrameUrl: 'https://cdn/a.png' } } as any }));
    const { result } = renderHook(() => useEquippedCardFrame(), {
      wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
    });

    expect(result.current.frameUrl).toBe('https://cdn/a.png');
    result.current.onFrameError();
    result.current.onFrameError();
    expect(invalidate).toHaveBeenCalledTimes(1);
  });
});
