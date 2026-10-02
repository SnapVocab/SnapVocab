import { createIcon } from './create-icon';

/** Storage box with a lid: the inventory row. */
export const BoxIcon = createIcon({
  viewBox: '0 0 24 24',
  elements: [
    {
      d: 'M2.4 7.2 4.6 3.4a2.6 2.6 0 0 1 2.3-1.3h10.2a2.6 2.6 0 0 1 2.3 1.3l2.2 3.8',
      stroke: '#000',
      strokeWidth: 1.7,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    },
    {
      d: 'M2.4 7.2h19.2v11.2a2.6 2.6 0 0 1-2.6 2.6H5a2.6 2.6 0 0 1-2.6-2.6V7.2Z',
      stroke: '#000',
      strokeWidth: 1.7,
      strokeLinejoin: 'round',
    },
    {
      d: 'M9.4 17h5.2',
      stroke: '#000',
      strokeWidth: 1.7,
      strokeLinecap: 'round',
    },
  ],
});
