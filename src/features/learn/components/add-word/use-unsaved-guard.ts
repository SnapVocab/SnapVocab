import { useNavigation, usePreventRemove } from '@react-navigation/native';
import * as React from 'react';
import { Alert } from 'react-native';
import { translate } from '@/lib/i18n';

/**
 * Leaving a form with the learner's own edits unsaved asks first (Back button, gesture or hardware Back).
 * `touch` wraps a change handler; `leave` is for leaving on purpose after a save.
 */
export function useUnsavedGuard(goBack: () => void) {
  const navigation = useNavigation();
  const [touched, setTouched] = React.useState(false);
  const leaving = React.useRef(false);

  usePreventRemove(touched, ({ data }) => {
    if (leaving.current) {
      navigation.dispatch(data.action);
      return;
    }
    Alert.alert(translate('learn.add_word.discard_title'), translate('learn.add_word.discard_body'), [
      { text: translate('learn.add_word.keep_editing'), style: 'cancel' },
      { text: translate('learn.add_word.discard'), style: 'destructive', onPress: () => navigation.dispatch(data.action) },
    ]);
  });

  const touch = React.useCallback(<A extends unknown[]>(change: (...args: A) => void) => (...args: A) => {
    setTouched(true);
    change(...args);
  }, []);

  return {
    touch,
    /** The form was saved and reset in place ("Lưu & thêm từ khác"). */
    markClean: () => setTouched(false),
    leave: () => {
      leaving.current = true;
      goBack();
    },
  };
}
