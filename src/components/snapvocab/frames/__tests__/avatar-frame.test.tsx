import { act, render, screen } from '@testing-library/react-native';
import * as React from 'react';
import { StyleSheet } from 'react-native';
import { AvatarFrame } from '../AvatarFrame';

// The initials scale with the avatar circle: 58% of the size inside a frame, 88% without one.
const initialsSize = () => StyleSheet.flatten(screen.getByText('AB').props.style).fontSize;

describe('avatar frame', () => {
  it('drops a frame that fails to load, so the avatar is not left shrunk inside an empty ring', () => {
    const onFrameError = jest.fn();
    render(<AvatarFrame frameUrl="https://cdn/a.png" initials="AB" size={80} onFrameError={onFrameError} />);
    expect(initialsSize()).toBe(17); // 46 px avatar inside the frame

    act(() => screen.getByTestId('avatar-frame-overlay').props.onError());

    expect(onFrameError).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('avatar-frame-overlay')).toBeNull();
    expect(initialsSize()).toBe(27); // 70 px avatar, as with no frame
  });

  it('shows the frame again when a new URL arrives', () => {
    const view = render(<AvatarFrame frameUrl="https://cdn/a.png" initials="AB" size={80} />);
    act(() => screen.getByTestId('avatar-frame-overlay').props.onError());

    view.rerender(<AvatarFrame frameUrl="https://cdn/b.png" initials="AB" size={80} />);

    expect(screen.getByTestId('avatar-frame-overlay').props.source).toEqual({ uri: 'https://cdn/b.png' });
  });
});
