import { createIcon } from './create-icon';

export const InfoIcon = createIcon({
  viewBox: '0 0 24 24',
  elements: [
    { cx: 12, cy: 12, r: 9, stroke: '#000', strokeWidth: 2 },
    { d: 'M12 11v5M12 8h.01', stroke: '#000', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
  ],
});
