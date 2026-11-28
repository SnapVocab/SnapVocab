import { renderHook } from '@testing-library/react-native';
import { usePopupStore } from '@/components/ui/popup/popup-store';
import i18n from '@/lib/i18n';
import { useCompleteQuiz } from '../api/quiz-api';
import { useFinishQuiz } from '../hooks/use-finish-quiz';

const mockReplace = jest.fn();
beforeAll(async () => {
  await i18n.changeLanguage('vi');
});
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }) }));
jest.mock('../api/quiz-api', () => ({ useCompleteQuiz: jest.fn() }));
jest.mock('../hooks/use-expired-session-handler', () => ({ useExpiredSessionHandler: () => () => false }));

describe('useFinishQuiz', () => {
  it('opens the result only after the server confirms, and retries the same quiz on failure', () => {
    const mutate = jest.fn();
    jest.mocked(useCompleteQuiz).mockReturnValue({ mutate, isPending: false } as unknown as ReturnType<typeof useCompleteQuiz>);
    const { result } = renderHook(() => useFinishQuiz(7));

    result.current.finish();
    mutate.mock.calls[0][1].onError(new Error('network'));
    expect(mockReplace).not.toHaveBeenCalled();
    const retry = usePopupStore.getState().dialogs[0]!.buttons.find(b => b.text === 'Thử lại')!;
    retry.onPress!();
    expect(mutate).toHaveBeenCalledTimes(2);
    expect(mutate.mock.calls[1][0]).toBe(7);

    mutate.mock.calls[1][1].onSuccess();
    expect(mockReplace).toHaveBeenCalledWith({ pathname: '/(app)/study/quiz-result', params: { quizId: '7' } });
  });
});
