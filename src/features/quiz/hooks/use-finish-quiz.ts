import { useRouter } from 'expo-router';
import { showDialog } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { useCompleteQuiz } from '../api/quiz-api';
import { classifyQuizError } from '../utils';
import { useExpiredSessionHandler } from './use-expired-session-handler';

/**
 * Finalizes a quiz for every quiz view and opens the result only after the server confirmed it.
 * Complete is replay-safe server-side (a COMPLETED quiz returns its result), so a failed or lost
 * response is retried in place instead of showing a result the server never recorded.
 * When the server says units are still unresolved (or the quiz is no longer active), retrying can
 * never succeed, so `onResync` reloads the session from the server instead.
 */
export function useFinishQuiz(quizId: number, onResync?: () => void) {
  const router = useRouter();
  const complete = useCompleteQuiz();
  const handleExpiredSession = useExpiredSessionHandler();

  const finish = () => {
    if (complete.isPending)
      return;
    complete.mutate(quizId, {
      onSuccess: () => {
        router.replace({
          pathname: '/(app)/study/quiz-result' as any,
          params: { quizId: String(quizId) },
        });
      },
      onError: (error) => {
        if (handleExpiredSession(error))
          return;
        if (onResync && classifyQuizError(error) === 'RESYNC') {
          onResync();
          return;
        }
        showDialog({
          title: translate('quiz.finish_unconfirmed_title'),
          message: translate('quiz.finish_unconfirmed_body'),
          kind: 'warning',
          buttons: [{ text: translate('quiz.later'), style: 'cancel' }, { text: translate('quiz.retry'), onPress: finish }],
        });
      },
    });
  };

  return { finish, isPending: complete.isPending };
}
