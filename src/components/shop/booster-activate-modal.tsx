import type { ActivationResultDTO, InventoryItemDTO } from '@/features/shop/types';
import { router } from 'expo-router';
import { ZapIcon } from 'lucide-react-native';
import * as React from 'react';
import { useMemo, useState } from 'react';
import { Modal, Text, View } from 'react-native';
import { Button, useSurface } from '@/components/ui';
import { generateIdempotencyKey } from '@/features/quiz/utils/idempotency';
import { isOutcomeUnknown, parseShopError } from '@/features/shop/api';
import { useActivateBoosterMutation } from '@/features/shop/hooks/use-shop-queries';
import { translate } from '@/lib/i18n';

/** HH:mm, plus the date when expiry is not on the server's current day (a 180-minute booster can cross midnight). */
function formatUntil(expiresAt: string, serverNow: string) {
  const end = new Date(expiresAt);
  const time = end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  return end.toDateString() === new Date(serverNow).toDateString()
    ? time
    : `${time} ${end.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}`;
}

export type BoosterItem = Pick<InventoryItemDTO, 'itemId' | 'name' | 'config' | 'quantity'>;

/**
 * Activation spends a card and starts a clock, so it is confirmed first and its result shown,
 * with the next step (a quiz) right there. Errors are toasted by the mutation; a definitive one closes
 * the modal, an unknown outcome (no response / 5xx) keeps it open so the retry reuses the key.
 */
export function BoosterActivateModal({ item, onClose }: { item: BoosterItem | null; onClose: () => void }) {
  const activate = useActivateBoosterMutation();
  const s = useSurface();
  const [result, setResult] = useState<ActivationResultDTO | null>(null);
  // One key per opening: a retried tap after a lost response replays instead of spending a second card.
  const idempotencyKey = useMemo(() => (item ? generateIdempotencyKey() : ''), [item]);

  if (!item) {
    return null;
  }

  const multiplier = item.config?.multiplier ?? 2;
  const minutes = item.config?.durationMinutes ?? 30;

  const close = () => {
    if (activate.isPending) {
      return;
    }
    setResult(null);
    onClose();
  };

  const confirm = async () => {
    try {
      setResult(await activate.mutateAsync({ itemId: item.itemId, idempotencyKey }));
    }
    catch (err) {
      if (!isOutcomeUnknown(parseShopError(err))) {
        close();
      }
    }
  };

  // A replayed key returns the original activation, which may already be over (compare on server time).
  const expired = result != null && Date.parse(result.activation.expiresAt) <= Date.parse(result.serverNow);
  const until = result ? formatUntil(result.activation.expiresAt, result.serverNow) : '';

  return (
    <Modal visible transparent animationType="fade" onRequestClose={close}>
      <View className="flex-1 items-center justify-center bg-black/60 p-5">
        <View style={{ backgroundColor: s.surface, borderColor: s.border }} className="w-full max-w-[350px] items-center rounded-[32px] border-2 border-b-[6px] p-6">
          <View className="mb-3 size-16 items-center justify-center rounded-2xl bg-amber-400">
            <ZapIcon size={32} color="white" />
          </View>

          {result && expired ? (
            <>
              <Text style={{ color: s.text }} className="mb-1 text-center font-nunito text-[20px] font-extrabold">
                {translate('shop.booster.replay_expired_title')}
              </Text>
              <Text style={{ color: s.textMuted }} className="mb-5 text-center font-inter text-[14px] leading-relaxed">
                {translate('shop.booster.replay_expired_body', { until, quantity: result.quantity })}
              </Text>
              <Button variant="primary" label={translate('shop.close')} textClassName="font-nunito" onPress={close} />
            </>
          ) : result ? (
            <>
              <Text style={{ color: s.text }} className="mb-1 text-center font-nunito text-[20px] font-extrabold">
                {translate('shop.booster.activated_title', { multiplier: result.activation.multiplier })}
              </Text>
              <Text style={{ color: s.textMuted }} className="mb-5 text-center font-inter text-[14px] leading-relaxed">
                {translate('shop.booster.activated_body', { until, quantity: result.quantity, multiplier: result.activation.multiplier })}
              </Text>
              <View className="w-full gap-2.5">
                <Button
                  variant="primary"
                  label={translate('shop.booster.start_quiz')}
                  textClassName="font-nunito"
                  onPress={() => {
                    close();
                    router.push('/study/quiz-setup');
                  }}
                />
                <Button variant="ghost" label={translate('shop.close')} textClassName="font-nunito" onPress={close} />
              </View>
            </>
          ) : (
            <>
              <Text style={{ color: s.text }} className="mb-1 text-center font-nunito text-[20px] font-extrabold">
                {translate('shop.booster.confirm_title')}
              </Text>
              <Text style={{ color: s.textMuted }} className="mb-2 text-center font-inter text-[14px] leading-relaxed">
                {translate('shop.booster.confirm_body', { name: item.name, multiplier, minutes })}
              </Text>
              <Text style={{ color: s.textMuted }} className="mb-5 text-center font-inter text-[13px]">
                {translate('shop.booster.confirm_note', { remaining: Math.max(0, item.quantity - 1) })}
              </Text>
              <View className="w-full flex-row gap-3">
                <Button variant="secondary" label={translate('shop.booster.later')} textClassName="font-nunito" className="flex-1" fullWidth={false} disabled={activate.isPending} onPress={close} />
                <Button variant="primary" label={translate('shop.actions.activate')} textClassName="font-nunito" className="flex-1" fullWidth={false} loading={activate.isPending} onPress={() => void confirm()} />
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
