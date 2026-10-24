import * as React from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import { LogOutIcon } from '@/components/ui/icons';
import { translate } from '@/lib/i18n';
import { useCancelQuiz } from '../api/quiz-api';
import { useExpiredSessionHandler } from '../hooks/use-expired-session-handler';

export type QuizExitModalProps = {
  visible: boolean;
  quizId: number;
  onClose: () => void;
  onExited: () => void;
};

/**
 * "Thoát" cancels the session and leaves only after the server confirmed it, so the learner is
 * never told a quiz was cancelled while it is still IN_PROGRESS. Cancel is replay-safe server-side.
 */
export function QuizExitModal({ visible, quizId, onClose, onExited }: QuizExitModalProps) {
  const cancelMutation = useCancelQuiz();
  const handleExpiredSession = useExpiredSessionHandler();
  const [failed, setFailed] = React.useState(false);

  const handleExit = () => {
    if (cancelMutation.isPending)
      return;
    setFailed(false);
    cancelMutation.mutate({ quizId }, {
      onSuccess: () => {
        onClose();
        onExited();
      },
      onError: (error) => {
        if (handleExpiredSession(error)) {
          onClose();
          return;
        }
        setFailed(true);
      },
    });
  };

  const handleStay = () => {
    setFailed(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleStay}>
      <View className="flex-1 items-center justify-center bg-black/50 p-6">
        <View className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
          <View className="mb-4 size-14 items-center justify-center self-center rounded-2xl bg-amber-50">
            <LogOutIcon size={28} className="text-amber-500" />
          </View>

          <Text className="mb-2 text-center font-nunito text-[20px] font-extrabold text-mascot-navy">
            {translate('quiz.exit_title')}
          </Text>
          <Text className="mb-6 text-center font-inter text-[14px] leading-relaxed text-neutral-500">
            {translate('quiz.exit_body')}
          </Text>

          {failed && (
            <Text accessibilityLiveRegion="polite" className="mb-4 text-center font-inter text-[13px] font-semibold text-error-700">
              {translate('quiz.cancel_error')}
            </Text>
          )}

          <View className="gap-2.5">
            <Pressable
              onPress={handleStay}
              disabled={cancelMutation.isPending}
              className="h-12 w-full items-center justify-center rounded-xl border-b-2 border-primary-700 bg-primary-500 active:bg-primary-600"
            >
              <Text className="font-nunito text-[15px] font-extrabold text-white">{translate('quiz.keep_playing')}</Text>
            </Pressable>

            <Pressable
              onPress={handleExit}
              disabled={cancelMutation.isPending}
              accessibilityState={{ busy: cancelMutation.isPending }}
              className="h-12 w-full items-center justify-center rounded-xl bg-neutral-100 active:bg-neutral-200"
            >
              {cancelMutation.isPending
                ? <ActivityIndicator size="small" color="#6B7280" />
                : <Text className="font-nunito text-[15px] font-extrabold text-neutral-600">{failed ? translate('quiz.retry_cancel') : translate('quiz.exit')}</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
