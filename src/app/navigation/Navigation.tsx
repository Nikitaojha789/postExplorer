import { useEffect, useRef } from 'react';

import { createStaticNavigation } from '@react-navigation/native';
import BootSplash from 'react-native-bootsplash';

import { analytics } from '@/core/analytics';
import { i18n } from '@/core/i18n';
import { registerNavigationContainer } from '@/core/monitoring';
import { navigationThemes, useColorSchemeName } from '@/ui';

import { linkingPrefixes } from './linking';
import { navigationRef } from './navigationRef';
import { RootStack } from './RootNavigator';

const StaticNavigation = createStaticNavigation(RootStack);

/**
 * Re-evaluates screen `options` (translated titles) after a same-direction
 * language switch without losing navigation state. Direction changes restart
 * the app anyway (see core/i18n).
 */
const useRetranslateNavigation = () => {
  useEffect(() => {
    const onLanguageChanged = () => {
      if (navigationRef.isReady()) navigationRef.resetRoot(navigationRef.getRootState());
    };
    i18n.on('languageChanged', onLanguageChanged);
    return () => i18n.off('languageChanged', onLanguageChanged);
  }, []);
};

export function Navigation() {
  const scheme = useColorSchemeName();
  const currentRoute = useRef<string | undefined>(undefined);
  useRetranslateNavigation();

  return (
    <StaticNavigation
      ref={navigationRef}
      theme={navigationThemes[scheme]}
      linking={{ enabled: 'auto', prefixes: linkingPrefixes }}
      onReady={() => {
        currentRoute.current = navigationRef.getCurrentRoute()?.name;
        registerNavigationContainer(navigationRef);
        // Hide the native splash only once the first screen can paint.
        void BootSplash.hide({ fade: true });
      }}
      onStateChange={() => {
        const next = navigationRef.getCurrentRoute()?.name;
        if (next && next !== currentRoute.current) {
          analytics.screen(next);
          currentRoute.current = next;
        }
      }}
    />
  );
}
