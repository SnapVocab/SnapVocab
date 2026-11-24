import { useUniwind } from 'uniwind';

/**
 * Icon tints for the profile screens. The design is light-first, so the dark
 * theme needs lighter shades or the navy icons disappear into the dark cards.
 * Every colour here is picked to stay readable on white and on the dark card.
 */
export function useIconColors() {
  // The theme comes from uniwind, not from react-native: the app lets the user
  // pick light or dark regardless of what the phone itself is set to.
  const { theme } = useUniwind();
  const pick = (light: string, dark: string) => (theme === 'dark' ? dark : light);

  return {
    /** Back chevrons and other icons sitting on the screen header. */
    header: pick('#1E2A44', '#E5E7EB'),
    /** Icons inside the round header buttons. */
    action: pick('#565879', '#C4C6DA'),
    /** Chevrons and other low-emphasis marks. */
    muted: pick('#9597AD', '#757793'),
    /** The logout row. */
    danger: pick('#EF4444', '#F87171'),
    /** The off state of a switch, which has no className of its own. */
    switchTrack: pick('#D4D5DF', '#2A2C47'),

    /** One hue per settings row, in the spirit of the orange streak icon. */
    row: {
      password: pick('#8253EC', '#9E7DFA'),
      biometric: pick('#0B8FCE', '#4BC2F8'),
      notification: pick('#FF8A00', '#FFA447'),
      goal: pick('#4CAD02', '#7DD634'),
      reminder: pick('#0B8FCE', '#4BC2F8'),
      language: pick('#25AD84', '#52DBA0'),
      theme: pick('#E5A800', '#FFD04D'),
    },

    /** The three tiles under the identity card, plus the menu rows below them. */
    stat: {
      streak: pick('#FF8A00', '#FFA447'),
      xp: pick('#E5A800', '#FFD04D'),
      coin: pick('#0B8FCE', '#4BC2F8'),
      trophy: pick('#E5A800', '#FFD04D'),
      inventory: pick('#8253EC', '#9E7DFA'),
    },
  };
}
