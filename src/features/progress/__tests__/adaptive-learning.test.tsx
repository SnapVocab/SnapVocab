import type { BestTimeDTO, ForecastDayDTO } from '../types';
import { render, screen } from '@testing-library/react-native';
import * as React from 'react';
import { MnemonicText } from '@/features/study/components/mnemonic-text';
import { BestTimeCard } from '../components/best-time-card';
import { peakDay, weekdayLabel } from '../components/forecast-card';

jest.mock('@/lib/i18n', () => ({
  translate: (key: string, opts?: Record<string, unknown>) => (opts ? `${key} ${JSON.stringify(opts)}` : key),
}));
jest.mock('@/components/ui', () => ({ Text: require('react-native').Text }));
jest.mock('@/components/ui/surface', () => ({ useColorMode: () => 'light' }));

const day = (date: string, dueCount: number): ForecastDayDTO => ({ date, dueCount, retention: 0.9 });

describe('forgetting forecast', () => {
  it('warns about the busiest later day only when it is busier than today', () => {
    const days = [day('2026-11-26', 4), day('2026-11-27', 2), day('2026-11-28', 9), day('2026-11-29', 9)];
    expect(peakDay(days)).toEqual({ day: days[2], index: 2 });
    expect(peakDay([day('2026-11-26', 10), day('2026-11-27', 3)])).toBeNull();
    expect(peakDay([day('2026-11-26', 0), day('2026-11-27', 0)])).toBeNull();
  });

  it('labels the first day "Hôm nay" and the rest by Vietnamese weekday', () => {
    expect(weekdayLabel('2026-11-26', 0, 'vi')).toBe('forecast.today');
    expect(weekdayLabel('2026-11-29', 3, 'vi')).toBe('CN');
    expect(weekdayLabel('2026-11-27', 1, 'vi')).toBe('T6');
    expect(weekdayLabel('2026-11-30', 4, 'vi')).toBe('T2');
  });
});

describe('best study time', () => {
  const slots = [0, 4, 8, 12, 16, 20].map(startHour => ({ startHour, reviews: 0, recallRate: null }));

  it('says how many more reviews it needs before naming a time', () => {
    const bestTime: BestTimeDTO = { enoughData: false, pairs: 12, minPairs: 30, bestStartHour: null, slots };
    render(<BestTimeCard bestTime={bestTime} />);
    expect(screen.getByText('forecast.best_not_enough {"pairs":12,"min":30}')).toBeOnTheScreen();
  });

  it('names the slot whose reviews stuck best', () => {
    const bestTime: BestTimeDTO = {
      enoughData: true,
      pairs: 40,
      minPairs: 30,
      bestStartHour: 8,
      slots: slots.map(slot => slot.startHour === 8
        ? { ...slot, reviews: 20, recallRate: 0.9 }
        : slot.startHour === 20 ? { ...slot, reviews: 20, recallRate: 0.5 } : slot),
    };
    render(<BestTimeCard bestTime={bestTime} />);
    expect(screen.getByText('forecast.best_result {"from":8,"to":12,"percent":90}')).toBeOnTheScreen();
    expect(screen.getByText('50%')).toBeOnTheScreen();
  });
});

describe('mnemonic text', () => {
  it('puts the Vietnamese hook in bold', () => {
    render(<MnemonicText mnemonic={{ content: '"hesitate" nghe như "hét đi Tết".', keyword: 'Hét đi Tết' }} />);
    expect(screen.getByText('hét đi Tết')).toBeOnTheScreen();
  });

  it('shows plain text when the hook is not in it', () => {
    render(<MnemonicText mnemonic={{ content: 'Một câu chuyện.', keyword: 'không có' }} />);
    expect(screen.getByText('Một câu chuyện.')).toBeOnTheScreen();
  });
});
