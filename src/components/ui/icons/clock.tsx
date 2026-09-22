import { createIcon } from './create-icon';

export const ClockIcon = createIcon({
  viewBox: '0 0 24 24',
  elements: [
    {
      cx: 12,
      cy: 12,
      r: 10,
      stroke: '#000',
      strokeWidth: 2,
    },
    {
      d: 'M12 6v6l4 2',
      stroke: '#000',
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    },
  ],
});
