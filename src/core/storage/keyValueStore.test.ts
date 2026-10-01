import { z } from 'zod';

import { appStorage } from './keyValueStore';

const Schema = z.object({ theme: z.enum(['light', 'dark']) });

describe('keyValueStore.getObject', () => {
  beforeEach(() => appStorage.clearAll());

  it('round-trips validated objects', () => {
    appStorage.setObject('prefs', { theme: 'dark' });
    expect(appStorage.getObject('prefs', Schema)).toEqual({ theme: 'dark' });
  });

  it('discards and removes data that no longer matches the schema', () => {
    appStorage.setObject('prefs', { theme: 'sepia' });
    expect(appStorage.getObject('prefs', Schema)).toBeUndefined();
    expect(appStorage.contains('prefs')).toBe(false);
  });

  it('discards corrupt JSON instead of throwing', () => {
    appStorage.setString('prefs', '{not json');
    expect(appStorage.getObject('prefs', Schema)).toBeUndefined();
    expect(appStorage.contains('prefs')).toBe(false);
  });
});
