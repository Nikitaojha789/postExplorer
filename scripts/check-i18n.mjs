#!/usr/bin/env node
/**
 * Fails when locale files drift from the source locale (en):
 *  - keys missing in a translation
 *  - keys present in a translation but not in the source
 * Plural forms (_zero/_one/_two/_few/_many/_other) are compared by base key,
 * because each language legitimately has a different set of plural forms.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = join(import.meta.dirname, '..', 'src', 'core', 'i18n', 'locales');
const SOURCE = 'en';
const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/;

const flatten = (obj, prefix = '') =>
  Object.entries(obj).flatMap(([key, value]) =>
    value !== null && typeof value === 'object'
      ? flatten(value, `${prefix}${key}.`)
      : [`${prefix}${key}`.replace(PLURAL_SUFFIX, '')],
  );

const load = file => new Set(flatten(JSON.parse(readFileSync(join(DIR, file), 'utf8'))));

const source = load(`${SOURCE}.json`);
let failed = false;

for (const file of readdirSync(DIR).filter(f => f.endsWith('.json') && f !== `${SOURCE}.json`)) {
  const keys = load(file);
  const missing = [...source].filter(k => !keys.has(k));
  const extra = [...keys].filter(k => !source.has(k));
  if (missing.length || extra.length) {
    failed = true;
    console.error(`✖ ${file}`);
    missing.forEach(k => console.error(`   missing: ${k}`));
    extra.forEach(k => console.error(`   extra:   ${k}`));
  }
}

if (failed) process.exit(1);
console.log(`✔ All locales match ${SOURCE}.json (${source.size} keys)`);
