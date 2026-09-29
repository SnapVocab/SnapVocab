import { createIcon } from './create-icon';

/** Clock wrapped by a turning arrow: the review reminder setting. */
export const ClockRotateIcon = createIcon({
  viewBox: '0 0 24 24',
  elements: [
    { cx: 12.6, cy: 12.6, r: 8, stroke: '#000', strokeWidth: 1.6 },
    {
      d: 'M12.6 7.8v4.8H8.4',
      stroke: '#000',
      strokeWidth: 1.6,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    },
    {
      d: 'M2.6 8.1A10.6 10.6 0 0 1 12.6 1.4',
      stroke: '#000',
      strokeWidth: 1.6,
      strokeLinecap: 'round',
    },
    {
      d: 'm2 4.3.5 4 4-.6',
      stroke: '#000',
      strokeWidth: 1.6,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    },
  ],
});
