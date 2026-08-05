import { createIcon } from './create-icon';

export const FlashIcon = createIcon({
  viewBox: '0 0 24 24',
  elements: [
    {
      d: 'M13 2L4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5z',
      fill: '#000',
    },
  ],
});

export const FlashOffIcon = createIcon({
  viewBox: '0 0 24 24',
  elements: [
    {
      d: 'M13 2L4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5z',
      stroke: '#000',
      strokeWidth: 1.8,
      strokeLinejoin: 'round',
    },
    {
      d: 'M3 3l18 18',
      stroke: '#000',
      strokeWidth: 2.2,
      strokeLinecap: 'round',
    },
  ],
});
