/* eslint-disable react-refresh/only-export-components */
import { useReactQueryDevTools } from '@dev-plugins/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as React from 'react';
import { store } from '@/features/auth/use-auth-store';

export const queryClient = new QueryClient({
  defaultOptions: {
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

export function APIProvider({ children }: { children: React.ReactNode }) {
  useReactQueryDevTools(queryClient);
  return (
    // Provide the client to your App
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
