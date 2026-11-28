import type { DialogButton, DialogPopup, PopupIcon, PopupKind, ToastPopup } from './popup-store';
import * as React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { translate } from '@/lib/i18n';
import { Button } from '../button';
import { AlertTriangleIcon, CheckCircleIcon, InfoIcon, XCircleIcon } from '../icons';
import { useColorMode, useSurface } from '../surface';
import { Text } from '../text';
import { orderButtons, TOAST_DURATION } from './popup-rules';
import { closeDialog, hideToast, usePopupStore } from './popup-store';

type Tone = { icon: PopupIcon; color: string; tile: string };

const TONES: Record<PopupKind, { light: Tone; dark: Tone }> = {
  success: {
    light: { icon: CheckCircleIcon, color: '#16A34A', tile: '#DCFCE7' },
    dark: { icon: CheckCircleIcon, color: '#4ADE80', tile: 'rgba(34, 197, 94, 0.16)' },
  },
  error: {
    light: { icon: XCircleIcon, color: '#DC2626', tile: '#FEE2E2' },
    dark: { icon: XCircleIcon, color: '#F87171', tile: 'rgba(239, 68, 68, 0.16)' },
  },
  info: {
    light: { icon: InfoIcon, color: '#0B8FCE', tile: '#E8F7FE' },
    dark: { icon: InfoIcon, color: '#7CD3F9', tile: 'rgba(28, 176, 246, 0.16)' },
  },
  warning: {
    light: { icon: AlertTriangleIcon, color: '#D97706', tile: '#FEF3C7' },
    dark: { icon: AlertTriangleIcon, color: '#FCD34D', tile: 'rgba(245, 158, 11, 0.16)' },
  },
};

/** Mounted once at the root: every success / error message and every confirm dialog of the app. */
export function PopupHost() {
  const toast = usePopupStore(state => state.toast);
  const dialog = usePopupStore(state => state.dialogs[0] ?? null);
  return (
    <>
      <DialogModal dialog={dialog} />
      <ToastModal toast={toast} />
    </>
  );
}

/** Keeps the last value while the modal fades out, so the card does not go blank mid-fade. */
function useLastShown<T>(value: T | null) {
  const [shown, setShown] = React.useState(value);
  if (value && value !== shown)
    setShown(value);
  return shown;
}

function ToastModal({ toast }: { toast: ToastPopup | null }) {
  const shown = useLastShown(toast);

  React.useEffect(() => {
    if (!toast)
      return;
    const timer = setTimeout(() => hideToast(toast.id), TOAST_DURATION[toast.kind]);
    return () => clearTimeout(timer);
  }, [toast]);

  const close = () => hideToast();

  return (
    <Modal visible={!!toast} transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={close}>
      {/* No dimming: a whole-screen fade in and out reads as a flicker, worst when the screen behind is navigating. */}
      <Pressable
        testID="popup-toast-backdrop"
        className="flex-1 items-center justify-center px-8"
        onPress={close}
        accessibilityRole="button"
        accessibilityLabel={translate('popup.close')}
      >
        {shown && (
          <PopupCard key={shown.id} kind={shown.kind} title={shown.title} message={shown.message} live floating>
            {shown.kind === 'error'
              ? <Button variant="secondary" size="sm" className="mt-5 min-w-28" fullWidth={false} label={translate('popup.close')} onPress={close} testID="popup-toast-close" />
              : <Hint />}
          </PopupCard>
        )}
      </Pressable>
    </Modal>
  );
}

function Hint() {
  const surface = useSurface();
  return (
    <Text className="mt-4 font-inter text-[12px] font-semibold" style={{ color: surface.textMuted }}>
      {translate('popup.tap_to_close')}
    </Text>
  );
}

function DialogModal({ dialog }: { dialog: DialogPopup | null }) {
  const shown = useLastShown(dialog);

  const press = (button: DialogButton) => {
    if (!dialog)
      return;
    closeDialog(dialog.id);
    button.onPress?.();
  };

  // Back / tapping outside means "cancel" when there is a cancel button, otherwise only a cancelable dialog closes.
  const dismiss = () => {
    if (!dialog)
      return;
    const cancel = dialog.buttons.find(button => button.style === 'cancel');
    if (cancel)
      press(cancel);
    else if (dialog.cancelable)
      closeDialog(dialog.id);
  };

  return (
    <Modal visible={!!dialog} transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={dismiss}>
      <View className="flex-1 items-center justify-center px-6">
        <Pressable testID="popup-dialog-backdrop" style={StyleSheet.absoluteFill} className="bg-black/50" onPress={dismiss} accessible={false} />
        {shown && (
          <PopupCard key={shown.id} kind={shown.kind} title={shown.title} message={shown.message} icon={shown.icon}>
            <View className="mt-6 w-full gap-1.5">
              {orderButtons(shown.buttons).map(({ button, variant }, index) => (
                <Button
                  // eslint-disable-next-line react/no-array-index-key -- labels may repeat; the list never reorders.
                  key={index}
                  variant={variant}
                  label={button.text}
                  textClassName={variant === 'secondary' && button.style === 'destructive' ? 'font-nunito text-danger-600 dark:text-[#F2A0A0]' : 'font-nunito'}
                  onPress={() => press(button)}
                />
              ))}
            </View>
          </PopupCard>
        )}
      </View>
    </Modal>
  );
}

type CardProps = {
  kind: PopupKind;
  title: string;
  message?: string;
  icon?: PopupIcon;
  /** Read out by screen readers as soon as it appears. */
  live?: boolean;
  /** Shown without a dimmed backdrop, so it needs its own shadow. */
  floating?: boolean;
  children?: React.ReactNode;
};

/** Lifts a card off an undimmed screen. */
const FLOATING = StyleSheet.create({
  card: {
    elevation: 18,
    shadowColor: '#0F172A',
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
  },
});

function PopupCard({ kind, title, message, icon, live, floating, children }: CardProps) {
  const surface = useSurface();
  const tone = TONES[kind][useColorMode()];
  const Icon = icon ?? tone.icon;
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(reduceMotion ? 1 : 0.88);
  React.useEffect(() => {
    if (!reduceMotion)
      scale.value = withSpring(1, { damping: 15, stiffness: 180 });
  }, [reduceMotion, scale]);
  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      accessibilityViewIsModal
      accessibilityRole={live ? 'alert' : undefined}
      accessibilityLiveRegion={live ? 'polite' : undefined}
      style={[cardStyle, floating && FLOATING.card, { backgroundColor: surface.surface, borderColor: surface.border }]}
      className="w-full max-w-[340px] items-center rounded-[28px] border-2 border-b-[5px] px-6 pt-6 pb-5"
    >
      <View className="size-16 items-center justify-center rounded-2xl" style={{ backgroundColor: tone.tile }}>
        <Icon size={34} color={tone.color} />
      </View>
      <Text className="mt-4 text-center font-nunito text-[19px]/6 font-extrabold" style={{ color: surface.text }}>
        {title}
      </Text>
      {!!message && (
        <Text className="mt-2 text-center font-inter text-[14px] leading-[21px]" style={{ color: surface.textMuted }}>
          {message}
        </Text>
      )}
      {children}
    </Animated.View>
  );
}
