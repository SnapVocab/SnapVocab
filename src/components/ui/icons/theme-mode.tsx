import { createIcon } from './create-icon';

/** Sun with a crescent inside: the appearance (light/dark) setting. */
export const ThemeModeIcon = createIcon({
  viewBox: '0 0 24 24',
  elements: [
    {
      cx: 12,
      cy: 12,
      r: 7,
      stroke: '#000',
      strokeWidth: 1.8,
    },
    {
      // A stroked crescent: filling it would read as a plain dot in the ring.
      d: 'M12 7.4a3.1 3.1 0 0 0 4.6 4.6 4.6 4.6 0 1 1-4.6-4.6Z',
      stroke: '#000',
      strokeWidth: 1.6,
      strokeLinejoin: 'round',
    },
    {
      d: 'M12 1.4v2.1M12 20.5v2.1M1.4 12h2.1M20.5 12h2.1M4.5 4.5l1.5 1.5M18 18l1.5 1.5M19.5 4.5 18 6M6 18l-1.5 1.5',
      stroke: '#000',
      strokeWidth: 1.8,
      strokeLinecap: 'round',
    },
  ],
});
