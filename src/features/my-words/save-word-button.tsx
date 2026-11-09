import { Button, showErrorMessage, showSuccessMessage } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { useSetMyWord } from './api';

export function SaveWordButton({ wordId, saved, onSaved }: { wordId: number; saved: boolean; onSaved?: () => void }) {
  const mutation = useSetMyWord();
  return (
    <Button
      tx={saved ? 'my_words.remove' : 'my_words.save'}
      variant={saved ? 'white' : 'primary'}
      loading={mutation.isPending}
      className="h-auto min-h-14 py-3"
      textClassName="shrink"
      onPress={() => mutation.mutate({ wordId, saved: !saved }, {
        onSuccess: () => {
          showSuccessMessage(translate(saved ? 'my_words.removed' : 'my_words.saved'));
          if (!saved)
            onSaved?.();
        },
        onError: () => showErrorMessage(translate('my_words.save_error')),
      })}
    />
  );
}
