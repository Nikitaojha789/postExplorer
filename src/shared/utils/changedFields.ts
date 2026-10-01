/**
 * Builds a minimal PATCH payload: only the keys whose (trimmed) value differs
 * between the original record and the edited form. `null`/`undefined` and
 * surrounding whitespace are treated as "no change".
 *
 * Migrated from the reference project (`src/utils/changedFields.ts`).
 */
const normalize = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  return value == null ? '' : JSON.stringify(value);
};

export const getChangedFields = <T extends object>(
  original: { [K in keyof T]?: T[K] | null } | null | undefined,
  current: T,
  keys: readonly (keyof T)[],
): Partial<Record<keyof T, string>> => {
  const changed: Partial<Record<keyof T, string>> = {};
  for (const key of keys) {
    const after = normalize(current[key]);
    if (normalize(original?.[key]) !== after) {
      changed[key] = after;
    }
  }
  return changed;
};

export const hasChanges = (changed: object): boolean => Object.keys(changed).length > 0;
