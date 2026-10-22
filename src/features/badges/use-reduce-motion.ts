import * as React from 'react';
import { AccessibilityInfo } from 'react-native';

/** OS "reduce motion" setting (design.md §11.5); every animation in this feature has a static equivalent. */
export function useReduceMotion(): boolean {
  const [reduce, setReduce] = React.useState(false);
  React.useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled?.().then((value) => {
      if (active)
        setReduce(Boolean(value));
    });
    const subscription = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setReduce);
    return () => {
      active = false;
      subscription?.remove();
    };
  }, []);
  return reduce;
}
