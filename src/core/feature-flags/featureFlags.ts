import { z } from 'zod';
import { create } from 'zustand';

import { appStorage, StorageKeys } from '@/core/storage';

/**
 * Typed feature flags with safe local defaults.
 *
 * Defaults ship in the binary so the app works offline and on first launch.
 * A remote source (Firebase Remote Config, LaunchDarkly, your API…) calls
 * `applyRemoteFlags()`; unknown keys and wrong types are ignored.
 */
const FlagsSchema = z.object({
  exampleNewFeedLayout: z.boolean(),
  maxUploadSizeMb: z.number().int().positive(),
});

export type FeatureFlags = z.infer<typeof FlagsSchema>;
export type FeatureFlagName = keyof FeatureFlags;

const DEFAULT_FLAGS: FeatureFlags = {
  exampleNewFeedLayout: false,
  maxUploadSizeMb: 10,
};

const PartialFlags = FlagsSchema.partial();

const loadPersisted = (): Partial<FeatureFlags> =>
  appStorage.getObject(StorageKeys.featureFlags, PartialFlags) ?? {};

interface FlagState {
  flags: FeatureFlags;
}

const useFlagStore = create<FlagState>()(() => ({
  flags: { ...DEFAULT_FLAGS, ...loadPersisted() },
}));

/** Validates, merges and persists flags fetched from a remote provider. */
export const applyRemoteFlags = (remote: unknown): void => {
  const parsed = PartialFlags.safeParse(remote);
  if (!parsed.success) return;
  appStorage.setObject(StorageKeys.featureFlags, parsed.data);
  useFlagStore.setState({ flags: { ...DEFAULT_FLAGS, ...parsed.data } });
};

/** Re-renders only when this specific flag changes. */
export const useFeatureFlag = <K extends FeatureFlagName>(name: K): FeatureFlags[K] =>
  useFlagStore(state => state.flags[name]);

/** Non-React access (services, navigation guards). */
export const getFeatureFlag = <K extends FeatureFlagName>(name: K): FeatureFlags[K] =>
  useFlagStore.getState().flags[name];
