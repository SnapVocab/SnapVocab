/* eslint-disable react-refresh/only-export-components */
import { useReactQueryDevTools } from '@dev-plugins/react-query';
import { focusManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as React from 'react';
import { AppState } from 'react-native';
import { store } from '@/features/auth/use-auth-store';

export const queryClient = new QueryClient({
  defaultOptions: {
    // Opt-in per query: refetching every screen's data on resume could clobber in-flight flows (e.g. a quiz).
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Every cached query is per-user: drop them all when the signed-in account changes (login, logout, switch).
store.subscribe((state, prev) => {
  if (state.user?.id !== prev.user?.id)
    queryClient.clear();
});

// React Native has no window focus events: treat "app returned to foreground" as focus,
// so opted-in stale queries (progress, XP) refetch on resume instead of showing yesterday's numbers.
focusManager.setEventListener((handleFocus) => {
  const subscription = AppState.addEventListener('change', state => handleFocus(state === 'active'));
  return () => subscription.remove();
});

export function APIProvider({ children }: { children: React.ReactNode }) {
  useReactQueryDevTools(queryClient);
  return (
    // Provide the client to your App
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
