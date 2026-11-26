import type { StoryDTO, SubmitStoryClozeResponse } from '../types';
import * as React from 'react';
import { View } from 'react-native';
import { Button, Pressable, showErrorMessage, Text } from '@/components/ui';
import { CheckCircleIcon, RotateCcwIcon, TrophyIcon } from '@/components/ui/icons';
import { apiErrorMessage } from '@/lib/api/error-message';
import { translate } from '@/lib/i18n';
import { useSubmitStoryCloze } from '../api';
import { buildStoryParagraphs } from '../utils';

type Props = {
  story: StoryDTO;
  onBackToRead: () => void;
};

export function StoryClozePanel({ story, onBackToRead }: Props) {
  const submitMutation = useSubmitStoryCloze();
  const { paragraphs, allBlanks } = React.useMemo(
    () => buildStoryParagraphs(story.sentences),
    [story.sentences],
  );

  // Build bank items preserving exact frequency so multi-occurrence words work naturally
  const bankItems = React.useMemo(() => {
    const counts = new Map<string, { word: string; total: number }>();
    for (const b of allBlanks) {
      const display = b.displayWord || b.answer;
      const key = display.toLowerCase();
      const prev = counts.get(key);
      if (prev)
        prev.total += 1;
      else
        counts.set(key, { word: display, total: 1 });
    }
    return Array.from(counts.values()).sort((a, b) => a.word.localeCompare(b.word));
  }, [allBlanks]);

  const [answers, setAnswers] = React.useState<Record<number, string>>({});
  const [activeBlank, setActiveBlank] = React.useState<number>(allBlanks[0]?.blankIndex ?? 1);
  const [result, setResult] = React.useState<SubmitStoryClozeResponse | null>(null);

  const usedCountByWord = React.useMemo(() => {
    const used = new Map<string, number>();
    for (const val of Object.values(answers)) {
      if (!val)
        continue;
      const key = val.toLowerCase();
      used.set(key, (used.get(key) ?? 0) + 1);
    }
    return used;
  }, [answers]);

  const filledCount = Object.values(answers).filter(Boolean).length;
  const progressPct = allBlanks.length > 0 ? Math.round((filledCount / allBlanks.length) * 100) : 0;

  const handleTapSlot = (blankIndex: number) => {
    if (result)
      return;
    if (answers[blankIndex] && activeBlank === blankIndex) {
      const next = { ...answers };
      delete next[blankIndex];
      setAnswers(next);
      return;
    }
    setActiveBlank(blankIndex);
  };

  const handlePickWord = (word: string) => {
    if (result || !activeBlank)
      return;
    const next = { ...answers, [activeBlank]: word };
    setAnswers(next);
    const nextEmpty = allBlanks.find(b => !next[b.blankIndex]);
    if (nextEmpty) {
      setActiveBlank(nextEmpty.blankIndex);
    }
  };

  const handleReset = () => {
    setAnswers({});
    setResult(null);
    setActiveBlank(allBlanks[0]?.blankIndex ?? 1);
  };

  const handleSubmit = async () => {
    try {
      const payload = allBlanks.map(b => ({
        blankIndex: b.blankIndex,
        value: answers[b.blankIndex] ?? '',
      }));
      const res = await submitMutation.mutateAsync({
        storyId: story.id,
        data: { answers: payload },
      });
      setResult(res);
    }
    catch (err: any) {
      showErrorMessage(apiErrorMessage(err, 'story.submit_error'));
    }
  };

  const resultMap = React.useMemo(() => {
    const map = new Map<number, { correct: boolean; expected: string }>();
    for (const r of result?.results ?? []) {
      map.set(r.blankIndex, { correct: r.correct, expected: r.expected });
    }
    return map;
  }, [result]);

  return (
    <View className="gap-4">
      {/* Cloze Progress Header */}
      <View className="rounded-2xl border border-line bg-surface px-4 py-3">
        <View className="mb-1.5 flex-row items-center justify-between">
          <Text className="font-nunito text-xs font-extrabold text-neutral-500 dark:text-neutral-300">
            {translate('story.cloze_progress', { filled: filledCount, total: allBlanks.length })}
          </Text>
          {filledCount > 0 && !result && (
            <Pressable onPress={handleReset} hitSlop={8}>
              <Text className="font-nunito text-xs font-black text-amber-700 dark:text-amber-300">
                {translate('story.clear_all')}
              </Text>
            </Pressable>
          )}
        </View>
        <View className="h-2.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
          <View className="h-full rounded-full bg-primary-500" style={{ width: `${progressPct}%` }} />
        </View>
      </View>

      {/* Interactive Cloze Story Page */}
      <View className="gap-5 rounded-3xl border-2 border-b-4 border-line border-b-edge bg-surface p-5">
        {paragraphs.map((para) => {
          return (
            <Text key={para.paragraph} className="font-inter text-[16.5px]/9 text-mascot-navy dark:text-neutral-100">
              {para.sentences.map(({ sentence, segments }, sIdx) => (
                <React.Fragment key={sentence.index}>
                  {sIdx > 0 ? ' ' : ''}
                  {segments.map((seg) => {
                    if (seg.type === 'text') {
                      return <Text key={seg.id}>{seg.text}</Text>;
                    }
                    const { blankIndex } = seg.blank;
                    const filled = answers[blankIndex];
                    const graded = resultMap.get(blankIndex);
                    const isActive = activeBlank === blankIndex && !graded;

                    const tone = graded
                      ? graded.correct
                        ? 'bg-primary-100 text-primary-800 dark:bg-primary-500/30 dark:text-primary-200'
                        : 'bg-danger-100 text-danger-700 dark:bg-danger-500/30 dark:text-danger-200'
                      : isActive
                        ? 'bg-amber-200/90 text-amber-950 underline decoration-amber-600 dark:bg-amber-500/35 dark:text-amber-100'
                        : filled
                          ? 'bg-sky-100 text-sky-900 dark:bg-sky-500/25 dark:text-sky-200'
                          : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-300';

                    const label = graded
                      ? graded.correct
                        ? `✓ ${filled}`
                        : `✗ ${filled || '___'} → ${graded.expected}`
                      : filled
                        ? `${blankIndex}. ${filled}`
                        : `${blankIndex}. ______`;

                    return (
                      <Text
                        key={seg.id}
                        onPress={() => handleTapSlot(blankIndex)}
                        className={`rounded-lg font-nunito font-black ${tone}`}
                      >
                        {`\u00A0[${label}]\u00A0`}
                      </Text>
                    );
                  })}
                </React.Fragment>
              ))}
            </Text>
          );
        })}
      </View>

      {/* Word Bank */}
      {!result && (
        <View className="gap-2.5">
          <Text className="font-nunito text-xs font-extrabold tracking-wider text-neutral-500 uppercase dark:text-neutral-300">
            {translate('story.word_bank')}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {bankItems.map(({ word, total }) => {
              const used = usedCountByWord.get(word.toLowerCase()) ?? 0;
              const exhausted = used >= total;
              return (
                <Pressable
                  key={word}
                  disabled={exhausted}
                  onPress={() => handlePickWord(word)}
                  className={`min-h-11 flex-row items-center gap-1.5 overflow-hidden rounded-xl border-2 border-b-4 px-3.5 ${
                    exhausted
                      ? 'border-line border-b-line bg-neutral-100 opacity-50 dark:bg-neutral-800'
                      : 'border-line border-b-edge bg-surface active:translate-y-px'
                  }`}
                >
                  {exhausted && <CheckCircleIcon width={13} height={13} color="#10B981" />}
                  <Text className="font-nunito text-sm font-black text-mascot-navy dark:text-white">
                    {word}
                  </Text>
                  {total > 1 && (
                    <Text className="font-nunito text-[11px] font-bold text-neutral-400">
                      {`×${total - used}`}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* Graded Celebration Card */}
      {result && (
        <View
          className={`rounded-3xl border-2 border-b-4 p-5 ${
            result.accuracyPercent >= 70
              ? 'border-primary-400 border-b-primary-600 bg-primary-50 dark:border-primary-600 dark:bg-primary-500/15'
              : 'border-amber-400 border-b-amber-600 bg-amber-50 dark:border-amber-600 dark:bg-amber-500/15'
          }`}
        >
          <View className="flex-row items-center gap-3">
            <View className="size-12 items-center justify-center rounded-2xl bg-white/80 dark:bg-neutral-900/60">
              <TrophyIcon width={24} height={24} color={result.accuracyPercent >= 70 ? '#58CC02' : '#F59E0B'} />
            </View>
            <View className="flex-1">
              <Text className="font-nunito text-lg font-black text-mascot-navy dark:text-white">
                {translate('story.score_summary', {
                  correct: result.correctCount,
                  total: result.totalBlanks,
                  percent: result.accuracyPercent,
                })}
              </Text>
              {result.xpAwardedNow > 0 && (
                <Text className="mt-0.5 font-nunito text-sm font-extrabold text-primary-700 dark:text-primary-300">
                  {translate('story.xp_earned', { xp: result.xpAwardedNow })}
                </Text>
              )}
            </View>
          </View>
        </View>
      )}

      {result ? (
        <View className="flex-row gap-2.5">
          <Button
            variant="white"
            label={translate('story.retry_cloze')}
            icon={<RotateCcwIcon width={16} height={16} color="#3D3F5E" />}
            onPress={handleReset}
            className="flex-1"
          />
          <Button
            label={translate('story.back_to_story')}
            onPress={onBackToRead}
            className="flex-1"
          />
        </View>
      ) : (
        <Button
          label={translate('story.check_answers')}
          loading={submitMutation.isPending}
          disabled={filledCount === 0}
          onPress={() => void handleSubmit()}
        />
      )}
    </View>
  );
}
