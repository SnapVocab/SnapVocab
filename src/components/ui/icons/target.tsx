import { createIcon } from './create-icon';

/** Target hit by an arrow: the daily goal setting. */
export const TargetIcon = createIcon({
  viewBox: '0 0 24 24',
  elements: [
    { cx: 11, cy: 13, r: 8.6, stroke: '#000', strokeWidth: 1.7 },
    { cx: 11, cy: 13, r: 5.2, stroke: '#000', strokeWidth: 1.7 },
    { cx: 11, cy: 13, r: 2, stroke: '#000', strokeWidth: 1.7 },
    {
      d: 'm11 13 7.4-7.4',
      stroke: '#000',
      strokeWidth: 1.7,
      strokeLinecap: 'round',
    },
    {
      d: 'M17.6 2.4 21.6 2.4 21.6 6.4 18.4 6.4 17.6 5.6Z',
      stroke: '#000',
      strokeWidth: 1.7,
      strokeLinejoin: 'round',
    },
  ],
});
