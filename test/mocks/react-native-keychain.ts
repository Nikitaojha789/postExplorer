/** In-memory Keychain keyed by service. */
const items = new Map<string, { username: string; password: string }>();

export const ACCESSIBLE = {
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'AccessibleAfterFirstUnlockThisDeviceOnly',
};

export const setGenericPassword = jest.fn(
  (username: string, password: string, options?: { service?: string }) => {
    items.set(options?.service ?? 'default', { username, password });
    return Promise.resolve({ service: options?.service ?? 'default', storage: 'mock' });
  },
);

export const getGenericPassword = jest.fn((options?: { service?: string }) => {
  const item = items.get(options?.service ?? 'default');
  return Promise.resolve(
    item ? { ...item, service: options?.service ?? 'default', storage: 'mock' } : false,
  );
});

export const resetGenericPassword = jest.fn((options?: { service?: string }) => {
  items.delete(options?.service ?? 'default');
  return Promise.resolve(true);
});

export const __reset = () => items.clear();
