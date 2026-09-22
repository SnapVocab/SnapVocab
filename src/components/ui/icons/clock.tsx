import { createIcon } from './create-icon';

export const ClockIcon = createIcon({
  viewBox: '0 0 24 24',
  elements: [
    {
      cx: 12,
      cy: 12,
      r: 9,
      stroke: '#000',
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    },
    {
      d: 'M12 7v5l3 3',
      stroke: '#000',
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    },
  ],
});
