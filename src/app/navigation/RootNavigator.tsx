import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { i18n } from '@/core/i18n';
import { FeedItemScreen, FeedScreen } from '@/features/feed';
import { PostDetailScreen, PostListScreen } from '@/features/posts';

/**
 * Static navigation config for PostExplorer:
 * Route types and deep-link paths are inferred from this tree.
 *
 * - native-stack: platform UINavigationController / Fragment transitions,
 *   run natively off the JS thread.
 * - PostList: root list screen (linking: '')
 * - PostDetail: detail screen for a selected post (linking: 'posts/:id')
 */
const RootStack = createNativeStackNavigator({
  screenOptions: {
    headerBackButtonDisplayMode: 'minimal',
  },
  screens: {
    PostList: {
      screen: PostListScreen,
      options: () => ({
        title: i18n.t('posts.listTitle'),
      }),
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
});

export { RootStack };

type RootStackType = typeof RootStack;

// Global typing: `useNavigation()` / `navigation.navigate()` are fully typed
// everywhere — features don't import the navigator to get types.
declare module '@react-navigation/native' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- declaration merging
  interface RootNavigator extends RootStackType {}
}
