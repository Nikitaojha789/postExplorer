import { StatusBar, StyleSheet } from 'react-native';

import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { persistOptions, queryClient } from '@/core/api';
import { useSessionStatus } from '@/core/auth';
import { ErrorBoundary } from '@/core/errors';
import { reportError, withMonitoring } from '@/core/monitoring';
import { OfflineBanner, ToastHost, useColorSchemeName } from '@/ui';

import { Navigation } from './navigation/Navigation';
import { RootErrorFallback } from './RootErrorFallback';

const resumePausedMutations = () => {
  void queryClient.resumePausedMutations();
};

/**
 * Provider order (outer → inner) is deliberate:
 * gestures/safe-area/keyboard are native-layer concerns; the query cache
 * must survive error-boundary resets; the boundary sits above everything
 * that renders feature code.
 */
function App() {
  const sessionStatus = useSessionStatus();
  const scheme = useColorSchemeName();

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <PersistQueryClientProvider
            client={queryClient}
            persistOptions={persistOptions}
            onSuccess={resumePausedMutations}
          >
            <ErrorBoundary
              fallback={RootErrorFallback}
              onError={(error, info) => reportError(error, { componentStack: info.componentStack })}
            >
              <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />
              {/* The native splash stays up while the session is restored. */}
              {sessionStatus !== 'restoring' && <Navigation />}
              <OfflineBanner />
              <ToastHost />
            </ErrorBoundary>
          </PersistQueryClientProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });

export const Root = withMonitoring(App);
