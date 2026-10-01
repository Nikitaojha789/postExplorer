/**
 * Must be the FIRST import of the app (see index.js).
 *
 * Hermes does not implement `Intl.PluralRules` (facebook/hermes#1462), which
 * i18next needs for correct plurals beyond one/other (e.g. Arabic has six
 * forms). The conditional `polyfill.js` entries are no-ops wherever the
 * engine already supports the API, so this self-retires when Hermes catches up.
 * Add locale-data for every supported language.
 */
import '@formatjs/intl-getcanonicallocales/polyfill.js';
import '@formatjs/intl-locale/polyfill.js';
import '@formatjs/intl-pluralrules/polyfill.js';
import '@formatjs/intl-pluralrules/locale-data/en.js';
import '@formatjs/intl-pluralrules/locale-data/ar.js';

import { z } from 'zod';

// Zod 4 compiles validators with `new Function` when available. On Hermes
// that code is interpreted, not JIT-compiled, so codegen costs startup time
// without the payoff. Measure with `jitless: false` before changing this.
z.config({ jitless: true });
