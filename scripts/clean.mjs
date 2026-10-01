#!/usr/bin/env node
/** Removes build outputs and caches. Run `npm install` and `npm run pods` afterwards. */
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const targets = [
  'node_modules',
  'android/build',
  'android/app/build',
  'android/.gradle',
  'android/.kotlin',
  'ios/build',
  'ios/Pods',
  'coverage',
  '.reassure',
].map(p => join(root, p));

for (const target of [...targets, join(tmpdir(), 'metro-cache')]) {
  rmSync(target, { recursive: true, force: true });
  console.log(`removed ${target}`);
}
