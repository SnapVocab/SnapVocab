import type { ButtonVariant } from '../button';
import type { DialogButton, ToastPopup } from './popup-store';

/** How long a message stays when nobody taps it; errors stay longer so they can be read. */
export const TOAST_DURATION: Record<ToastPopup['kind'], number> = {
  success: 2200,
  info: 3000,
  error: 4500,
};

/** The first action leads (red when it destroys something), further actions follow, cancel sits last. */
export function orderButtons(buttons: DialogButton[]): { button: DialogButton; variant: ButtonVariant }[] {
  const actions = buttons.filter(button => button.style !== 'cancel');
  const cancels = buttons.filter(button => button.style === 'cancel');
  return [
    ...actions.map((button, i) => ({
      button,
      variant: (i === 0 ? (button.style === 'destructive' ? 'danger' : 'primary') : 'secondary') as ButtonVariant,
    })),
    ...cancels.map(button => ({ button, variant: 'ghost' as ButtonVariant })),
  ];
}
