import type { Href } from 'expo-router';
import type { TodayState } from './today-state';
import type { SnapyPose } from '@/components/ui/snapy';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Button, Text } from '@/components/ui';
import { Snapy } from '@/components/ui/snapy';
import { translate } from '@/lib/i18n';
import { useStudyToday } from './api';
import { StudyCountLabels } from './study-count-labels';
import { sessionMinutes, todayState } from './today-state';

type Copy = {
  /** Big numeral + label, or a title when a number would only add pressure (backlog, break, done). */
  value?: number;
  label?: string;
  title?: string;
  desc?: string;
  cta?: string;
  foot?: string;
  /** Snapy only where it has a job: new learner, coming back, done (learn_ui.md principle 7). */
  pose?: SnapyPose;
};

function copyFor(state: TodayState): Copy {
  switch (state.kind) {
    case 'empty':
      return {
        title: translate('learn.today.empty_title'),
        desc: translate('learn.today.empty_desc'),
        cta: translate('learn.today.cta_explore'),
        pose: 'welcome',
      };
    case 'backlog':
      return {
        title: translate('learn.today.backlog_title'),
        desc: translate('learn.today.backlog_desc'),
        cta: translate('learn.today.cta_review', { count: state.count }),
        foot: translate('learn.today.backlog_foot'),
      };
    case 'returning':
      return {
        title: translate('learn.today.returning_title'),
        desc: translate('learn.today.returning_desc', { count: state.count }),
        cta: translate('learn.today.cta_review', { count: state.count }),
        pose: 'welcome',
      };
    case 'in_progress':
      return {
        value: state.due,
        label: translate('learn.today.in_progress_label'),
        desc: translate('learn.today.in_progress_desc', { count: state.studied }),
        cta: translate('learn.today.cta_continue', { count: state.count }),
        foot: translate('learn.today.minutes', { count: sessionMinutes(state.count) }),
      };
    case 'due':
      return {
        value: state.due,
        label: state.newCount
          ? translate('learn.today.due_with_new', { count: state.newCount })
          : translate('learn.today.due_label'),
        cta: translate('learn.today.cta_start', { count: state.count }),
        foot: translate('learn.today.minutes', { count: sessionMinutes(state.count) }),
      };
    case 'new':
      return {
        value: state.newCount,
        label: translate('learn.today.new_label'),
        desc: state.afterReview ? translate('learn.today.new_after_review') : undefined,
        cta: translate('learn.today.cta_new', { count: state.newCount }),
        foot: translate('learn.today.minutes', { count: sessionMinutes(state.newCount) }),
      };
    case 'done':
      return {
        title: translate('learn.today.done_title'),
        desc: state.dueTomorrow
          ? translate('learn.today.done_tomorrow', { count: state.dueTomorrow })
          : translate('learn.today.done_nothing'),
        pose: 'happy',
      };
  }
}

/**
 * The "Hôm nay" block (learn_ui.md §8.2 B): one sentence, at most one green button, one tap to the first card.
 * Learn shows it in full; Home shows the compact form. Both read the same query (principle 8).
 */
export function TodayBlock({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const today = useStudyToday();

  if (today.isLoading)
    return <View className={compact ? 'mb-4 h-28 rounded-3xl bg-neutral-100 dark:bg-neutral-800' : 'mx-5 mb-6 h-44 rounded-3xl bg-neutral-100 dark:bg-neutral-800'} />;

  if (today.isError || !today.data) {
    return (
      <Pressable
        onPress={() => void today.refetch()}
        accessibilityRole="button"
        className={compact ? 'mb-4 rounded-3xl bg-neutral-100 p-5 dark:bg-neutral-800' : 'mx-5 mb-6 rounded-3xl bg-neutral-100 p-5 dark:bg-neutral-800'}
      >
        <Text className="font-nunito text-base font-black text-mascot-navy dark:text-white">{translate('learn.today.error')}</Text>
        <Text className="mt-1 font-inter text-sm font-bold text-primary-600 dark:text-primary-400">{translate('learn.today.retry')}</Text>
      </Pressable>
    );
  }

  const state = todayState(today.data);
  const copy = copyFor(state);
  const hasCards = today.data.dueCount + today.data.newCount > 0;
  const cta = hasCards ? translate('learn.today.cta_start', { count: today.data.sessionCount }) : copy.cta;
  const onPress = state.kind === 'empty'
    ? () => router.push({ pathname: '/(app)/collections', params: { view: 'explore' } } as Href)
    : () => router.push('/(app)/study/session' as Href);

  if (compact) {
    return (
      <View className="mb-4 rounded-3xl border-2 border-b-[5px] border-emerald-300 border-b-emerald-500 bg-emerald-50 p-5 dark:border-emerald-800 dark:border-b-emerald-700 dark:bg-emerald-950/40">
        <Text className="font-nunito text-lg font-black text-mascot-navy dark:text-white">
          {hasCards ? translate('study_limits.today') : copy.title ?? `${copy.value} ${copy.label}`}
        </Text>
        {hasCards && <StudyCountLabels counts={today.data} className="mt-2" />}
        {!!copy.desc && <Text className="mt-1 font-inter text-sm text-neutral-600 dark:text-neutral-300">{copy.desc}</Text>}
        {!!cta && <Button className="mt-4 h-auto min-h-14 py-3" textClassName="flex-1" label={cta} variant="primary" onPress={onPress} />}
      </View>
    );
  }

  return (
    <View className="px-5 pt-2 pb-6">
      {!!copy.pose && <Snapy pose={copy.pose} animation="none" className="mb-3 size-20" />}
      {hasCards ? <StudyCountLabels counts={today.data} className="py-2" /> : copy.value !== undefined
        ? (
            <View accessible accessibilityLabel={`${copy.value} ${copy.label}`}>
              <Text className="font-nunito text-6xl font-black text-mascot-navy dark:text-white">{copy.value}</Text>
              <Text className="font-inter text-base font-semibold text-neutral-500 dark:text-neutral-400">{copy.label}</Text>
            </View>
          )
        : <Text className="font-nunito text-2xl font-black text-mascot-navy dark:text-white">{copy.title}</Text>}
      {!!copy.desc && <Text className="mt-1 font-inter text-sm text-neutral-500 dark:text-neutral-400">{copy.desc}</Text>}
      {!!cta && <Button className="mt-5" label={cta} variant="primary" onPress={onPress} testID="today-cta" />}
      {!!copy.foot && <Text className="mt-2 text-center font-inter text-xs text-neutral-400">{hasCards ? translate('learn.today.minutes', { count: sessionMinutes(today.data.sessionCount) }) : copy.foot}</Text>}
    </View>
  );
}
