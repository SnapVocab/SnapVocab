import type { BottomSheetModalProps } from '@gorhom/bottom-sheet';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { BackHandler } from 'react-native';

type Props = BottomSheetModalProps & { ref?: React.Ref<BottomSheetModal | null> };

/**
 * BottomSheetModal that Android Back closes. The library ignores hardware Back, so Back used to skip the open
 * sheet and act on the screen behind it (leaving a collection with its options sheet still up). The listener is
 * added when the sheet opens, i.e. after the screen's own Back handlers, so it runs first.
 */
export function AppBottomSheetModal({ ref, onChange, ...props }: Props) {
  const inner = React.useRef<BottomSheetModal>(null);
  React.useImperativeHandle(ref, () => inner.current as BottomSheetModal, []);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open)
      return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      inner.current?.dismiss();
      return true;
    });
    return () => subscription.remove();
  }, [open]);

  return (
    <BottomSheetModal
      ref={inner}
      {...props}
      onChange={(index, position, type) => {
        setOpen(index >= 0);
        onChange?.(index, position, type);
      }}
    />
  );
}
