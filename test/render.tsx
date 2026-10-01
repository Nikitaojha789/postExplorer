import type { ReactElement, ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initI18n } from '@/core/i18n';

initI18n();

/** Fresh client per test: no retries, no cache bleed between tests. */
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      // Infinity disables GC timers that would otherwise keep Jest alive.
      mutations: { retry: false, gcTime: Infinity },
    },
  });

/** Renders with the app's real providers (minus navigation). */
export const renderWithProviders = async (
  ui: ReactElement,
  options?: RenderOptions & { queryClient?: QueryClient },
) => {
  const queryClient = options?.queryClient ?? createTestQueryClient();
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </SafeAreaProvider>
  );
  return { queryClient, ...(await render(ui, { wrapper: Wrapper, ...options })) };
};
