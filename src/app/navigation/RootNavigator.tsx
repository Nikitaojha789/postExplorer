import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useIsSignedIn, useIsSignedOut } from '@/core/auth';
import { i18n } from '@/core/i18n';
import { SignInScreen } from '@/features/auth';
import { FeedItemScreen, FeedScreen } from '@/features/feed';
import { PostDetailScreen, PostListScreen } from '@/features/posts';
import { SettingsScreen } from '@/features/settings';
import { Text } from '@/ui';

/**
 * Bottom tabs for authenticated users:
 * - PostList: Main list of posts
 * - Settings: Appearance, language, and session sign out
 */
const MainTabs = createBottomTabNavigator({
  screenOptions: {
    headerShown: true,
    tabBarLabelStyle: { fontSize: 13, fontWeight: '600' },
  },
  screens: {
    PostList: {
      screen: PostListScreen,
      options: () => ({
        title: i18n.t('posts.listTitle'),
        tabBarLabel: i18n.t('tabs.posts'),
        tabBarButtonTestID: 'tab-posts',
        tabBarIcon: () => <Text style={{ fontSize: 18 }}>📰</Text>,
      }),
      linking: '',
    },
    Settings: {
      screen: SettingsScreen,
      options: () => ({
        title: i18n.t('settings.title'),
        tabBarLabel: i18n.t('tabs.settings'),
        tabBarButtonTestID: 'tab-settings',
        tabBarIcon: () => <Text style={{ fontSize: 18 }}>⚙️</Text>,
      }),
      linking: 'settings',
    },
  },
});

/**
 * Static navigation config for PostExplorer:
 * Route types and deep-link paths are inferred from this tree.
 *
 * - native-stack: platform UINavigationController / Fragment transitions,
 *   run natively off the JS thread.
 * - Groups with `if` guards swap between signed-out (SignIn) and signed-in
 *   (main app) screens based on session state.
 */
const RootStack = createNativeStackNavigator({
  screenOptions: {
    headerBackButtonDisplayMode: 'minimal',
  },
  groups: {
    SignedOut: {
      if: useIsSignedOut,
      screenOptions: { headerShown: false },
      screens: {
        SignIn: {
          screen: SignInScreen,
          linking: 'sign-in',
        },
      },
    },
    SignedIn: {
      if: useIsSignedIn,
      screens: {
        Main: {
          screen: MainTabs,
          options: { headerShown: false },
          linking: '',
        },
        PostDetail: {
          screen: PostDetailScreen,
          options: () => ({
            title: i18n.t('posts.detailTitle'),
            headerBackTitle: i18n.t('posts.backTitle'),
          }),
          linking: { path: 'posts/:id', parse: { id: Number } },
        },
        Feed: {
          screen: FeedScreen,
          options: () => ({
            title: i18n.t('feed.title'),
          }),
          linking: 'feed',
        },
        FeedItem: {
          screen: FeedItemScreen,
          options: () => ({
            title: i18n.t('feed.detailTitle'),
          }),
          linking: { path: 'items/:id', parse: { id: String } },
        },
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
