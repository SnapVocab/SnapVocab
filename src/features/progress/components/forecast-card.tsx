import type { ForecastDayDTO, ForecastDTO } from '../types';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Svg, { Circle, Polyline, Rect } from 'react-native-svg';
import { Text } from '@/components/ui';
import { useColorMode } from '@/components/ui/surface';
import { translate } from '@/lib/i18n';
import { formatDate } from '../utils';

const CHART_HEIGHT = 110;
const LABEL_SPACE = 14;

/** "T2".."CN" in Vietnamese, "Mon".. otherwise; the first day is "Hôm nay". */
export function weekdayLabel(date: string, index: number, language: string) {
  if (index === 0)
    return translate('forecast.today');
  const parsed = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime()))
    return date;
  // Vietnamese labels come from the day number: ICU builds disagree on "Th 6" vs "Thứ 6".
  if (language.startsWith('vi')) {
    const weekday = parsed.getUTCDay();
    return weekday === 0 ? 'CN' : `T${weekday + 1}`;
  }
  return parsed.toLocaleDateString(language, { weekday: 'short', timeZone: 'UTC' });
}

const percent = (value: number | null | undefined) => Math.round((value ?? 0) * 100);

/** The busiest later day worth warning about, if it is busier than today. */
export function peakDay(days: ForecastDayDTO[]) {
  const later = days.slice(1).reduce<{ day: ForecastDayDTO; index: number } | null>((best, day, i) =>
    day.dueCount > (best?.day.dueCount ?? 0) ? { day, index: i + 1 } : best, null);
  return later && later.day.dueCount > (days[0]?.dueCount ?? 0) ? later : null;
}

/** Bars: cards due per day. Line: average recall chance at the end of each day if nothing is reviewed. */
export function ForecastCard({ forecast }: { forecast: ForecastDTO }) {
  const { i18n } = useTranslation();
  const isDark = useColorMode() === 'dark';
  const [width, setWidth] = React.useState(0);
  const { days } = forecast;
  const maxDue = Math.max(1, ...days.map(day => day.dueCount));
  const retentions = days.map(day => day.retention).filter((value): value is number => value !== null);
  // Retention sits high (0.7..1): scale from just below the lowest value so the slope is visible.
  const floor = Math.max(0, Math.min(0.5, ...retentions.map(value => value - 0.1)));
  const column = width / Math.max(1, days.length);
  const yOf = (value: number) => LABEL_SPACE + (1 - (value - floor) / (1 - floor)) * (CHART_HEIGHT - LABEL_SPACE);
  const points = days
    .map((day, i) => day.retention === null ? null : `${column * i + column / 2},${yOf(day.retention)}`)
    .filter(Boolean)
    .join(' ');
  const peak = peakDay(days);

  return (
    <View className="gap-2.5 rounded-2xl border border-line bg-surface p-3.5" testID="forecast-card">
      {forecast.retentionNow !== null && (
        <Text className="font-nunito text-sm font-black text-neutral-900 dark:text-white">
          {translate('forecast.retention_now', { percent: percent(forecast.retentionNow) })}
        </Text>
      )}
      <View onLayout={event => setWidth(event.nativeEvent.layout.width)} style={{ height: CHART_HEIGHT }}>
        {width > 0 && (
          <Svg width={width} height={CHART_HEIGHT}>
            {days.map((day, i) => {
              const height = day.dueCount ? Math.max(3, (day.dueCount / maxDue) * (CHART_HEIGHT - LABEL_SPACE - 6)) : 2;
              const barWidth = Math.min(26, column * 0.55);
              return (
                <Rect
                  key={day.date}
                  x={column * i + (column - barWidth) / 2}
                  y={CHART_HEIGHT - height}
                  width={barWidth}
                  height={height}
                  rx={4}
                  fill={day.dueCount ? (i === peak?.index ? '#1899D6' : isDark ? '#3A7CA5' : '#8FD3F7') : isDark ? '#3A3F47' : '#D4D5DF'}
                />
              );
            })}
            {points && <Polyline points={points} fill="none" stroke="#F59E0B" strokeWidth={2.5} strokeLinejoin="round" />}
            {days.map((day, i) => day.retention === null
              ? null
              : <Circle key={`r-${day.date}`} cx={column * i + column / 2} cy={yOf(day.retention)} r={3.5} fill="#F59E0B" />)}
          </Svg>
        )}
      </View>
      <View className="flex-row">
        {days.map((day, i) => (
          <View
            key={day.date}
            className="flex-1 items-center"
            accessible
            accessibilityLabel={translate('forecast.day_a11y', {
              date: formatDate(day.date),
              count: day.dueCount,
              percent: percent(day.retention),
            })}
          >
            <Text className="font-inter text-[11px] font-black text-neutral-800 dark:text-neutral-100">{day.dueCount}</Text>
            <Text className="font-inter text-[10px] text-neutral-500 dark:text-neutral-400" numberOfLines={1}>
              {weekdayLabel(day.date, i, i18n.language)}
            </Text>
          </View>
        ))}
      </View>
      {peak && (
        <Text className="font-inter text-[13px]/5 font-semibold text-sky-800 dark:text-sky-200">
          {translate('forecast.peak', { day: weekdayLabel(peak.day.date, peak.index, i18n.language), count: peak.day.dueCount })}
        </Text>
      )}
      <Text className="font-inter text-[11px]/4 text-neutral-500 dark:text-neutral-400">{translate('forecast.hint')}</Text>
    </View>
  );
}
