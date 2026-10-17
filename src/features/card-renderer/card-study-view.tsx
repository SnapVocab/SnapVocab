import type { CardSide, CardStudyViewProps, StudySessionResult } from './types';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { ScrollView, View } from 'react-native';
import { BackButton, Button } from '@/components/ui';
import { CheckIcon, RotateCwIcon, TrophyIcon } from '@/components/ui/icons';
import { Text } from '@/components/ui/text';
import { CardActionToolbar } from './components/card-action-toolbar';
import { DynamicCardRenderer } from './dynamic-card-renderer';

export function CardStudyView({
  items,
  template,
  schema,
  topicName = 'Học từ vựng',
  onComplete,
  onExit,
}: CardStudyViewProps) {
  const router = useRouter();

  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [currentSide, setCurrentSide] = React.useState<CardSide>('FRONT');
  const [rememberedIds, setRememberedIds] = React.useState<Set<number | string>>(() => new Set());
  const [forgotIds, setForgotIds] = React.useState<Set<number | string>>(() => new Set());
  const [isFinished, setIsFinished] = React.useState(false);

  const total = items.length;
  const currentItem = items[currentIndex];

  const handleBack = onExit ?? (() => router.back());

  const handleFlip = () => {
    setCurrentSide(prev => (prev === 'FRONT' ? 'BACK' : 'FRONT'));
  };

  const advanceCard = (isRemembered: boolean) => {
    if (!currentItem)
      return;

    const itemId = currentItem.topicItemId || (currentItem as any).id || currentIndex;

    if (isRemembered) {
      setRememberedIds(prev => new Set(prev).add(itemId));
    }
    else {
      setForgotIds(prev => new Set(prev).add(itemId));
    }

    if (currentIndex + 1 < total) {
      setCurrentIndex(prev => prev + 1);
      setCurrentSide('FRONT');
    }
    else {
      // Session finished
      const remCount = isRemembered ? rememberedIds.size + 1 : rememberedIds.size;
      const forgCount = isRemembered ? forgotIds.size : forgotIds.size + 1;
      const xp = remCount * 10 + 20; // 10 XP per remembered card + 20 completion bonus

      const result: StudySessionResult = {
        totalCards: total,
        rememberedCount: remCount,
        forgotCount: forgCount,
        xpEarned: xp,
      };

      setIsFinished(true);
      onComplete?.(result);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setCurrentSide('FRONT');
    setRememberedIds(new Set());
    setForgotIds(new Set());
    setIsFinished(false);
  };

  // 1. Completion Screen
  if (isFinished || total === 0) {
    const remCount = rememberedIds.size;
    const accuracy = total > 0 ? Math.round((remCount / total) * 100) : 0;
    const xp = remCount * 10 + 20;

    return (
      <View className="flex-1 justify-between bg-slate-50 p-6 dark:bg-neutral-950">
        <View className="items-center pt-8">
          <View className="size-20 items-center justify-center rounded-3xl border-2 border-amber-300/80 bg-amber-100/80 shadow-md dark:border-amber-700/80 dark:bg-amber-950/80">
            <TrophyIcon width={40} height={40} color="#D97706" />
          </View>
          <Text className="mt-5 font-nunito text-2xl font-black tracking-tight text-mascot-navy dark:text-white">
            HOÀN THÀNH BÀI HỌC!
          </Text>
          <Text className="mt-1 font-inter text-sm font-medium text-neutral-500 dark:text-neutral-400">
            Bạn đã xuất sắc ôn tập xong danh sách thẻ từ
          </Text>

          {/* Stats Grid */}
          <View className="mt-8 w-full flex-row items-center justify-between gap-3">
            {/* Accuracy */}
            <View className="flex-1 items-center rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
              <Text className="font-nunito text-2xl font-black text-primary-600 dark:text-primary-400">
                {accuracy}
                %
              </Text>
              <Text className="mt-1 font-inter text-xs font-bold text-neutral-400">
                Độ chính xác
              </Text>
            </View>

            {/* Remembered */}
            <View className="flex-1 items-center rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-4 shadow-xs dark:border-emerald-900/60 dark:bg-emerald-950/40">
              <Text className="font-nunito text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {remCount}
              </Text>
              <Text className="mt-1 font-inter text-xs font-bold text-emerald-700 dark:text-emerald-300">
                Đã thuộc
              </Text>
            </View>

            {/* XP */}
            <View className="flex-1 items-center rounded-2xl border border-amber-200/80 bg-amber-50/50 p-4 shadow-xs dark:border-amber-900/60 dark:bg-amber-950/40">
              <Text className="font-nunito text-2xl font-black text-amber-600 dark:text-amber-400">
                +
                {xp}
              </Text>
              <Text className="mt-1 font-inter text-xs font-bold text-amber-700 dark:text-amber-300">
                Kinh nghiệm XP
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="w-full gap-3 pb-6">
          <Button
            label="Luyện tập lại"
            variant="outline"
            icon={<RotateCwIcon color="#4D7C0F" width={18} height={18} />}
            onPress={handleRestart}
          />
          <Button
            label="Hoàn tất bài học"
            icon={<CheckIcon color="#FFFFFF" width={18} height={18} />}
            onPress={handleBack}
          />
        </View>
      </View>
    );
  }

  const progressPercent = total > 0 ? ((currentIndex + 1) / total) * 100 : 0;

  return (
    <View className="flex-1 bg-slate-50 dark:bg-neutral-950">
      {/* Top Header & Progress */}
      <View className="border-b border-neutral-200/70 bg-white px-5 pt-3 pb-4 dark:border-neutral-800 dark:bg-neutral-900">
        <View className="flex-row items-center justify-between">
          <BackButton onPress={handleBack} />

          <View className="mx-3 flex-1 items-center">
            <Text className="font-nunito text-base font-extrabold text-mascot-navy dark:text-white" numberOfLines={1}>
              {topicName}
            </Text>
            <Text className="mt-0.5 font-inter text-xs font-bold text-neutral-400">
              {currentIndex + 1}
              {' '}
              /
              {' '}
              {total}
              {' '}
              thẻ
            </Text>
          </View>

          <View className="min-w-10 flex-row items-center justify-center gap-1 rounded-full border border-reward-200 bg-reward-50 px-2.5 py-2 dark:border-reward-700 dark:bg-amber-950/40">
            <TrophyIcon width={13} height={13} color="#D97706" />
            <Text className="font-nunito text-xs font-black text-reward-700 dark:text-reward-300">
              {rememberedIds.size * 10}
            </Text>
            <Text className="font-inter text-[9px] font-extrabold text-reward-700 dark:text-reward-300">XP</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
          <View
            style={{ width: `${progressPercent}%` }}
            className="h-full rounded-full bg-primary-500"
          />
        </View>
      </View>

      {/* Main Flashcard Center Canvas */}
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <DynamicCardRenderer
          key={`card-${currentIndex}`}
          template={template}
          schema={schema}
          data={currentItem}
          side={currentSide}
          onFlip={setCurrentSide}
          isInteractive
          minHeight={400}
        />
      </ScrollView>

      {/* Bottom Action Toolbar */}
      <View className="border-t border-neutral-200/70 bg-white px-4 pt-1 pb-6 dark:border-neutral-800 dark:bg-neutral-900">
        <CardActionToolbar
          onForgot={() => advanceCard(false)}
          onFlip={handleFlip}
          onRemembered={() => advanceCard(true)}
        />
      </View>
    </View>
  );
}

export default CardStudyView;
