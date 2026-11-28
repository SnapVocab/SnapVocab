import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { showDialog } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { isQuizSessionExpired } from '../utils';

/**
 * One reaction to QUIZ_SESSION_EXPIRED (D17) for every quiz view: the session cannot be continued,
 * so tell the learner and send them to Quiz Setup. Returns true when the error was an expiry and
 * was handled here.
 */
export function useExpiredSessionHandler() {
  const router = useRouter();

  return useCallback((error: unknown): boolean => {
    if (!isQuizSessionExpired(error))
      return false;

    showDialog({
      title: translate('quiz.error_expired_title'),
      message: translate('quiz.error_expired_desc'),
      kind: 'warning',
      buttons: [{
        text: translate('quiz.btn_new_quiz'),
        onPress: () => router.replace('/(app)/study/quiz-setup' as any),
      }],
    });
    return true;
  }, [router]);
}
