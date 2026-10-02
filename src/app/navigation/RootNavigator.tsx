import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useIsSignedIn, useIsSignedOut } from '@/core/auth';
import { i18n } from '@/core/i18n';
import { SignInScreen } from '@/features/auth';
import { FeedItemScreen, FeedScreen } from '@/features/feed';
import { SettingsScreen } from '@/features/settings';

/**
 * Static navigation config: route types and deep-link paths are inferred
 * from this tree, so there is no hand-maintained ParamList to drift.
 *
 * - native-stack: platform UINavigationController / Fragment transitions,
 *   run natively off the JS thread.
 * - Auth gating via `if:` groups: when the session flips, React Navigation
 *   swaps the stacks itself. Never `navigate()` after sign-in/out.
 * - Titles call `i18n.t` lazily; `useRetranslateNavigation` re-evaluates them.
 * - EVERY screen declares an explicit `linking` path. With `enabled: 'auto'`,
 *   a screen without one gets `''` and collides with `Main`, which breaks
 *   ALL deep links at runtime. `linking.test.ts` enforces this.
 */
const MainTabs = createBottomTabNavigator({
  // Icons hidden until the app adds its icon set (e.g. react-native-svg):
  // set `tabBarIcon` per screen and remove `tabBarIconStyle`.
  screenOptions: {
    headerShown: true,
    tabBarIconStyle: { display: 'none' },
    tabBarLabelStyle: { fontSize: 15 },
  },
  screens: {
    Feed: {
      screen: FeedScreen,
      options: () => ({
        title: i18n.t('feed.title'),
        tabBarLabel: i18n.t('tabs.feed'),
        tabBarButtonTestID: 'tab-feed',
      }),
      linking: 'feed',
    },
    Settings: {
      screen: SettingsScreen,
      options: () => ({
        title: i18n.t('settings.title'),
        tabBarLabel: i18n.t('tabs.settings'),
        tabBarButtonTestID: 'tab-settings',
      }),
      linking: 'settings',
    },
  },
});

const RootStack = createNativeStackNavigator({
  screenOptions: { headerBackButtonDisplayMode: 'minimal' },
  groups: {
    SignedIn: {
      if: useIsSignedIn,
      screens: {
        Main: { screen: MainTabs, options: { headerShown: false }, linking: '' },
        FeedItem: {
          screen: FeedItemScreen,
          options: () => ({ title: i18n.t('feed.detailTitle') }),
          linking: { path: 'items/:id', parse: { id: String } },
        },
      },
    },
    SignedOut: {
      if: useIsSignedOut,
      screens: {
        SignIn: { screen: SignInScreen, options: { headerShown: false }, linking: 'sign-in' },
      },
    },
  },
});

export { RootStack };

type RootStackType = typeof RootStack;

// Global typing: `useNavigation()` / `navigation.navigate()` are fully typed
// everywhere — features don't import the navigator to get types.
declare module '@react-navigation/native' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- declaration merging
  interface RootNavigator extends RootStackType {}
}
