import { createPathConfigForStaticNavigation, getStateFromPath } from '@react-navigation/native';

import { RootStack } from './RootNavigator';

/**
 * Deep-link paths are derived from the static navigator tree. A conflict
 * (e.g. a screen without a path gets `''` from `enabled: 'auto'` and collides
 * with `Main`) only surfaces at RUNTIME when a link is opened — so it is
 * caught here instead.
 */
// `true` = the same auto mode as `linking={{ enabled: 'auto' }}` in Navigation.tsx.
const screens = createPathConfigForStaticNavigation(RootStack, {}, true) ?? {};
const resolve = (path: string) => getStateFromPath(path, { screens });

/** Route names from root to leaf, plus the leaf's params. */
const leaf = (path: string) => {
  const names: string[] = [];
  let params: unknown;
  let state = resolve(path);
  while (state) {
    const route = state.routes[state.routes.length - 1];
    if (!route) break;
    names.push(route.name);
    params = route.params;
    state = route.state;
  }
  return { names, params };
};

interface StaticConfig {
  screens?: Record<string, unknown>;
  groups?: Record<string, { screens?: Record<string, unknown> }>;
}

/** Every screen in the tree, with whether it declares `linking`. */
const collectScreens = (config: StaticConfig, prefix = ''): [string, boolean][] =>
  [
    ...Object.entries(config.screens ?? {}),
    ...Object.values(config.groups ?? {}).flatMap(group => Object.entries(group.screens ?? {})),
  ].flatMap(([name, entry]) => {
    const item = entry as { linking?: unknown; screen?: { config?: StaticConfig } };
    const nested = item.screen?.config;
    return [
      [`${prefix}${name}`, item.linking !== undefined] as [string, boolean],
      ...(nested ? collectScreens(nested, `${prefix}${name} › `) : []),
    ];
  });

describe('deep linking', () => {
  it('every screen declares an explicit `linking` path', () => {
    const missing = collectScreens(RootStack.config as StaticConfig)
      .filter(([, hasLinking]) => !hasLinking)
      .map(([name]) => name);
    expect(missing).toEqual([]);
  });

  it.each([
    ['', ['Main', 'PostList'], undefined],
    ['settings', ['Main', 'Settings'], undefined],
    ['posts/12', ['PostDetail'], { id: 12 }],
    ['feed', ['Feed'], undefined],
    ['items/abc-1', ['FeedItem'], { id: 'abc-1' }],
    ['sign-in', ['SignIn'], undefined],
  ])('resolves %s', (path, names, params) => {
    const result = leaf(path);
    expect(result.names).toEqual(names);
    expect(result.params).toEqual(params);
  });
});
