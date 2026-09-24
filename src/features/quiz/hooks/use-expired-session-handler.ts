import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Alert } from 'react-native';
import { isQuizSessionExpired } from '../utils';

/**
 * One reaction to QUIZ_SESSION_EXPIRED (D16) for every quiz view: the session cannot be continued,
 * so tell the learner and send them to Quiz Setup. Returns true when the error was an expiry and
 * was handled here.
 */
export function useExpiredSessionHandler() {
  const router = useRouter();

  return useCallback((error: unknown): boolean => {
    if (!isQuizSessionExpired(error))
      return false;

    Alert.alert(
      'Phiên quiz đã hết hạn',
      'Phiên làm bài chỉ giữ trong 24 giờ. Vui lòng tạo bài mới.',
      [{
        text: 'Tạo bài mới',
        onPress: () => router.replace('/(app)/study/quiz-setup' as any),
      }],
    );
    return true;
  }, [router]);
}
