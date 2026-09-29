import { createIcon } from './create-icon';

/** Outline bell, used by the push notification setting. */
export const BellIcon = createIcon({
  viewBox: '0 0 24 24',
  elements: [
    {
      d: 'M12 2.2a1.6 1.6 0 0 1 1.6 1.6v1.1a6.4 6.4 0 0 1 4.8 6.2v2.2c0 2.1.8 4.1 2.3 5.6H3.3a8 8 0 0 0 2.3-5.6v-2.2a6.4 6.4 0 0 1 4.8-6.2V3.8A1.6 1.6 0 0 1 12 2.2Z',
      stroke: '#000',
      strokeWidth: 1.6,
      strokeLinejoin: 'round',
    },
    {
      d: 'M9.2 18.9a2.8 2.8 0 0 0 5.6 0',
      stroke: '#000',
      strokeWidth: 1.6,
      strokeLinecap: 'round',
    },
  ],
});
