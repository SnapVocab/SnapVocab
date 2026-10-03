import type { HistoryBucket, HistoryPeriod } from '../types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { Text } from '@/components/ui';
import { useProgressHistory } from '../api';
import { SectionError } from './progress-primitives';

const limits = { DAY: 7, WEEK: 4, MONTH: 6 };

function formatBucketLabel(date: string, period: HistoryPeriod, language: string) {
  const parsed = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }
  if (period === 'DAY') {
    const raw = parsed.toLocaleDateString(language, { weekday: 'short', timeZone: 'UTC' });
    // Normalize "Th 2" -> "T2", "Chủ nhật" -> "CN" in Vietnamese for compact readability
    if (language.startsWith('vi')) {
      if (raw.toLowerCase().includes('chủ') || raw.toLowerCase().includes('cn')) {
        return 'CN';
      }
      return raw.replace(/^Th\s*/i, 'T');
    }
    return raw;
  }
  if (period === 'WEEK') {
    return parsed.toLocaleDateString(language, {
      day: '2-digit',
      month: '2-digit',
      timeZone: 'UTC',
    });
  }
  return parsed.toLocaleDateString(language, { month: 'short', timeZone: 'UTC' });
}

export function ActivityHistoryChart() {
  const { t, i18n } = useTranslation();
  const [period, setPeriod] = useState<HistoryPeriod>('DAY');
  const [selected, setSelected] = useState<HistoryBucket | null>(null);

  const query = useProgressHistory(period);
  const buckets = query.data?.buckets ?? [];
  const visible = [...buckets]
    .sort((a, b) => a.periodStart.localeCompare(b.periodStart))
    .slice(-limits[period]);

  // The backend returns a longer default range (30 days / 12 weeks / 12 months); the total and the
  // range label describe only the bars on screen.
  const total = visible.reduce((sum, bucket) => sum + bucket.eventCount, 0);
  const max = Math.max(1, ...visible.map(bucket => bucket.eventCount));
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  const chartHeight = 84;

  return (
    <View className="mb-4 gap-2.5 px-1 pt-1">
      {/* Header and Period Switcher */}
      <View className="flex-row items-center justify-between">
        <Text className="font-nunito text-base font-bold text-neutral-800 dark:text-neutral-200">
          {t('progressUx.history')}
        </Text>

        <View accessibilityRole="tablist" className="flex-row gap-1 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800">
          {(['DAY', 'WEEK', 'MONTH'] as const).map((value) => {
            const isTabActive = period === value;
            return (
              <Pressable
                key={value}
                accessibilityRole="tab"
                accessibilityState={{ selected: isTabActive }}
                onPress={() => {
                  setPeriod(value);
                  setSelected(null);
                }}
                className={`rounded-lg px-2.5 py-1 ${
                  isTabActive
                    ? 'bg-white shadow-xs dark:bg-neutral-700'
                    : 'bg-transparent'
                }`}
              >
                <Text
                  className={`font-inter text-xs font-bold ${
                    isTabActive
                      ? 'text-mascot-navy dark:text-white'
                      : 'text-neutral-400 dark:text-neutral-400'
                  }`}
                >
                  {t(`progressUx.${value}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* States: Loading, Error, Empty, or Chart */}
      {query.isLoading ? (
        <View className="h-28 items-center justify-center">
          <Text className="font-inter text-xs text-neutral-400">
            {t('progressUx.loading')}
          </Text>
        </View>
      ) : query.isError ? (
        <SectionError message={t('progressUx.error')} onRetry={() => void query.refetch()} />
      ) : total === 0 ? (
        /* Genuine Flat Empty State: No Nested Card */
        <View className="items-center justify-center gap-1.5 rounded-2xl bg-neutral-50/80 p-4 dark:bg-neutral-900/60">
          <Text className="font-nunito text-sm font-extrabold text-neutral-800 dark:text-neutral-200">
            {t('progressUx.historyEmpty')}
          </Text>
          <Text className="text-center font-inter text-xs text-neutral-400 dark:text-neutral-400">
            {t('progressUx.historyHint')}
          </Text>
        </View>
      ) : (
        /* Chart With Data */
        <View className="gap-2.5 rounded-2xl border border-neutral-100 bg-white p-3.5 dark:border-neutral-800 dark:bg-neutral-900">
          <View className="flex-row items-center justify-between">
            <Text className="font-nunito text-sm font-black text-neutral-900 dark:text-white">
              {t('progressUx.activityTotal', { count: total })}
            </Text>
            {query.data && (
              <Text className="font-inter text-[11px] text-neutral-400">
                {t('progressUx.range', { from: visible[0].periodStart, to: query.data.to })}
              </Text>
            )}
          </View>

          {/* Bar Chart Grid */}
          <View className="flex-row items-end justify-between border-b border-neutral-100 pt-2 pb-1 dark:border-neutral-800">
            {visible.map((bucket) => {
              const isToday = period === 'DAY' && bucket.periodStart === today;
              const isSelected = selected?.periodStart === bucket.periodStart;
              const barHeight = bucket.eventCount
                ? Math.max(8, Math.round((bucket.eventCount / max) * chartHeight))
                : 3;

              return (
                <Pressable
                  key={bucket.periodStart}
                  testID={`history-bucket-${bucket.periodStart}`}
                  accessibilityRole="button"
                  accessibilityLabel={t('progressUx.bucket', {
                    date: bucket.periodStart,
                    count: bucket.eventCount,
                    days: bucket.activeDays,
                  })}
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => setSelected(bucket)}
                  hitSlop={4}
                  className="mx-0.5 flex-1 items-center"
                >
                  {/* Event count on top if selected or active */}
                  <Text
                    className={`mb-1 font-inter text-[10px] ${
                      isSelected
                        ? 'font-black text-primary-600 dark:text-primary-400'
                        : 'font-medium text-neutral-400'
                    }`}
                  >
                    {bucket.eventCount > 0 ? bucket.eventCount : ''}
                  </Text>

                  {/* SVG Bar */}
                  <View
                    style={{ height: chartHeight }}
                    className="w-full max-w-[28px] items-center justify-end"
                  >
                    <Svg width={24} height={chartHeight}>
                      <Rect
                        x={0}
                        y={chartHeight - barHeight}
                        width={24}
                        height={barHeight}
                        rx={3}
                        fill={
                          bucket.eventCount > 0
                            ? isToday
                              ? '#58CC02'
                              : isSelected
                                ? '#4CAD02'
                                : '#7DD634'
                            : '#D4D5DF'
                        }
                      />
                    </Svg>
                  </View>

                  {/* Date label under bar */}
                  <View
                    className={`mt-1.5 rounded-md px-1 py-0.5 ${
                      isToday ? 'bg-primary-500' : isSelected ? 'bg-neutral-100 dark:bg-neutral-800' : ''
                    }`}
                  >
                    <Text
                      className={`text-center font-inter text-[11px] font-bold ${
                        isToday
                          ? 'text-white'
                          : isSelected
                            ? 'text-neutral-900 dark:text-white'
                            : 'text-neutral-400'
                      }`}
                    >
                      {period === 'WEEK'
                        ? t('progressUx.weekLabel', {
                            date: formatBucketLabel(bucket.periodStart, period, i18n.language),
                          })
                        : formatBucketLabel(bucket.periodStart, period, i18n.language)}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Interactive selected bucket detail */}
          {selected && (
            <View className="rounded-xl bg-neutral-50 p-2.5 dark:bg-neutral-800/60">
              <Text
                accessibilityLiveRegion="polite"
                className="font-inter text-xs text-neutral-700 dark:text-neutral-200"
              >
                {t('progressUx.bucket', {
                  date: selected.periodStart,
                  count: selected.eventCount,
                  days: selected.activeDays,
                })}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
