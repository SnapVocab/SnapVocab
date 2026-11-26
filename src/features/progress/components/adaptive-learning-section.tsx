import * as React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui';
import { useLeeches } from '@/features/study/mnemonic-api';
import { translate } from '@/lib/i18n';
import { useForecast } from '../api';
import { BestTimeCard } from './best-time-card';
import { ForecastCard } from './forecast-card';
import { LeechWordsCard } from './leech-words-card';
import { SectionError } from './progress-primitives';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-4 gap-2.5 px-1 pt-1">
      <Text className="font-nunito text-base font-bold text-neutral-800 dark:text-neutral-200">{title}</Text>
      {children}
    </View>
  );
}

function Loading() {
  return (
    <View className="h-24 items-center justify-center rounded-2xl border border-line bg-surface">
      <Text className="font-inter text-xs text-neutral-400">{translate('progressUx.loading')}</Text>
    </View>
  );
}

/**
 * Adaptive learning on the stats screen: forgetting forecast, best study time and the words the learner keeps
 * forgetting (with AI mnemonics). Each block owns its loading, error and empty states.
 */
export function AdaptiveLearningSection() {
  const forecast = useForecast();
  const leeches = useLeeches();

  return (
    <>
      <Section title={translate('forecast.title')}>
        {forecast.isLoading
          ? <Loading />
          : forecast.isError || !forecast.data
            ? <SectionError onRetry={() => void forecast.refetch()} />
            : forecast.data.cardsTracked === 0
              ? (
                  <View className="items-center rounded-2xl border border-line bg-surface p-4">
                    <Text className="text-center font-inter text-[13px] text-neutral-500 dark:text-neutral-400">
                      {translate('forecast.empty')}
                    </Text>
                  </View>
                )
              : <ForecastCard forecast={forecast.data} />}
      </Section>

      {forecast.data && (
        <Section title={translate('forecast.best_title')}>
          <BestTimeCard bestTime={forecast.data.bestTime} />
        </Section>
      )}

      <Section title={translate('mnemonic.leeches_title')}>
        {leeches.isLoading
          ? <Loading />
          : leeches.isError || !leeches.data
            ? <SectionError onRetry={() => void leeches.refetch()} />
            : <LeechWordsCard items={leeches.data.items} total={leeches.data.total} />}
      </Section>
    </>
  );
}
