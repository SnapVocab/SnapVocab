import { useColorScheme } from 'react-native';

/**
 * Icon tints for the profile screens. The design is light-first, so the dark
 * theme needs lighter greys or the navy icons disappear into the dark cards.
 */
export function useIconColors() {
  const isDark = useColorScheme() === 'dark';

  return {
    /** Back chevrons and other icons sitting on the screen header. */
    header: isDark ? '#E5E7EB' : '#1E2A44',
    /** Icons inside the round header buttons. */
    action: isDark ? '#C4C6DA' : '#565879',
    /** Leading icons of the settings rows. */
    row: isDark ? '#A1A3BD' : '#757793',
  };
}
