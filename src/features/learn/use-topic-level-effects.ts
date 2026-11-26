import { useFocusEffect } from 'expo-router';
import * as React from 'react';
import { BackHandler } from 'react-native';

/** Android Back walks up one topic level, like the header back button, before leaving the collection. */
export function useBackWalksUpTopics(depth: number, walkUp: () => void) {
  useFocusEffect(React.useCallback(() => {
    if (depth === 0)
      return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      walkUp();
      return true;
    });
    return () => subscription.remove();
  }, [depth, walkUp]));
}

type Pager = { hasNextPage: boolean; isFetchingNextPage: boolean; fetchNextPage: () => unknown };

/**
 * The search box filters what is loaded. While a query is typed, the remaining pages load too, so a word on
 * page 3 is still found (UX audit #5).
 */
export function useLoadAllWhileSearching(searching: boolean, pager: Pager) {
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = pager;
  React.useEffect(() => {
    if (searching && hasNextPage && !isFetchingNextPage)
      void fetchNextPage();
  }, [searching, hasNextPage, isFetchingNextPage, fetchNextPage]);
}
