import { createIcon } from './create-icon';

/** Globe with meridians, used by the interface language setting. */
export const GlobeIcon = createIcon({
  viewBox: '0 0 24 24',
  elements: [
    { cx: 12, cy: 12, r: 9.2, stroke: '#000', strokeWidth: 1.6 },
    {
      d: 'M12 2.8v18.4M2.8 12h18.4',
      stroke: '#000',
      strokeWidth: 1.6,
      strokeLinecap: 'round',
    },
    {
      d: 'M12 2.8c2.6 2.5 4 5.7 4 9.2s-1.4 6.7-4 9.2c-2.6-2.5-4-5.7-4-9.2s1.4-6.7 4-9.2Z',
      stroke: '#000',
      strokeWidth: 1.6,
      strokeLinejoin: 'round',
    },
    {
      d: 'M4.7 6.2A13 13 0 0 0 12 8.3a13 13 0 0 0 7.3-2.1M4.7 17.8A13 13 0 0 1 12 15.7a13 13 0 0 1 7.3 2.1',
      stroke: '#000',
      strokeWidth: 1.6,
      strokeLinecap: 'round',
    },
  ],
});
