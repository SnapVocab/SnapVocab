import { createIcon } from './create-icon';

/** Masked characters in a chat bubble, with a person behind: the password setting. */
export const PasswordIcon = createIcon({
  viewBox: '0 0 24 24',
  elements: [
    { cx: 12, cy: 3.9, r: 2.3, stroke: '#000', strokeWidth: 1.6 },
    {
      d: 'M6.8 11.2a5.2 5.2 0 0 1 10.4 0',
      stroke: '#000',
      strokeWidth: 1.6,
      strokeLinecap: 'round',
    },
    {
      d: 'M4.5 10.6h15a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-8.2L7.6 22.6v-3h-3.1a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2Z',
      stroke: '#000',
      strokeWidth: 1.6,
      strokeLinejoin: 'round',
    },
    {
      d: 'M7.4 13.1v3.4M5.9 13.9l3 1.8M8.9 13.9l-3 1.8M12 13.1v3.4M10.5 13.9l3 1.8M13.5 13.9l-3 1.8M16.6 13.1v3.4M15.1 13.9l3 1.8M18.1 13.9l-3 1.8',
      stroke: '#000',
      strokeWidth: 1.4,
      strokeLinecap: 'round',
    },
  ],
});
