import type { defaultNS, resources } from './resources';

// Compile-time checked translation keys: t('feed.title') ✓, t('feed.titel') ✗
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS;
    resources: (typeof resources)['en'];
  }
}
