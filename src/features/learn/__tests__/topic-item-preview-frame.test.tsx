import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render } from '@testing-library/react-native';
import * as React from 'react';
import { store } from '@/features/auth/use-auth-store';
import { TopicItemPreviewModal } from '../components/collection-detail/topic-item-preview-modal';

const rendered: Record<string, unknown>[] = [];
jest.mock('@/features/card-renderer', () => ({
  DynamicCardRenderer: (props: Record<string, unknown>) => {
    rendered.push(props);
    return null;
  },
}));
jest.mock('@/features/profile/api', () => ({ meKey: ['me'] }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));

const item = { topicItemId: 1, topicId: 1, word: 'apple' } as any;

function renderPreview() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <TopicItemPreviewModal bottomSheetRef={{ current: null }} item={item} />
    </QueryClientProvider>,
  );
}

describe('collection card preview wears the equipped card frame (card_frame_plan.md PD-CF-01)', () => {
  beforeEach(() => {
    rendered.length = 0;
  });

  it('passes the equipped frame and a height cap to the card', () => {
    act(() => store.setState({ user: { id: 1, equipped: { avatarFrameUrl: null, cardFrameUrl: 'https://cdn/card.png' } } as any }));
    renderPreview();
    const props = rendered.at(-1)!;
    expect(props.frameUrl).toBe('https://cdn/card.png');
    expect(props.maxHeight).toBeGreaterThan(0);
    expect(props.onFrameError).toEqual(expect.any(Function));
  });

  it('without a frame the card keeps its usual look', () => {
    act(() => store.setState({ user: { id: 1, equipped: { avatarFrameUrl: null, cardFrameUrl: null } } as any }));
    renderPreview();
    expect(rendered.at(-1)!.frameUrl).toBeNull();
    expect(rendered.at(-1)!.minHeight).toBe(380);
  });
});
