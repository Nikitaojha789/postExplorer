import { appStorage, StorageKeys } from '@/core/storage';

import { applyRemoteFlags, getFeatureFlag } from './featureFlags';

describe('feature flags', () => {
  it('ships safe defaults', () => {
    expect(getFeatureFlag('exampleNewFeedLayout')).toBe(false);
    expect(getFeatureFlag('maxUploadSizeMb')).toBe(10);
  });

  it('applies and persists valid remote values', () => {
    applyRemoteFlags({ exampleNewFeedLayout: true });
    expect(getFeatureFlag('exampleNewFeedLayout')).toBe(true);
    expect(appStorage.getString(StorageKeys.featureFlags)).toContain('exampleNewFeedLayout');
  });

  it('ignores payloads with wrong types', () => {
    applyRemoteFlags({ maxUploadSizeMb: 'lots' });
    expect(getFeatureFlag('maxUploadSizeMb')).toBe(10);
  });
});
