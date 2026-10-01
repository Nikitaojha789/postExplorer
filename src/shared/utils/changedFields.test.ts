import { getChangedFields, hasChanges } from './changedFields';

describe('getChangedFields', () => {
  const original = { name: 'Ada', email: 'ada@example.com', phone: null as string | null };

  it('returns only modified keys, trimmed', () => {
    const changed = getChangedFields(original, { ...original, email: ' ada@new.com ' }, [
      'name',
      'email',
      'phone',
    ]);
    expect(changed).toEqual({ email: 'ada@new.com' });
    expect(hasChanges(changed)).toBe(true);
  });

  it('treats null/undefined/whitespace as equivalent to empty', () => {
    const changed = getChangedFields(original, { ...original, phone: '  ' }, ['phone']);
    expect(hasChanges(changed)).toBe(false);
  });

  it('ignores keys not listed', () => {
    expect(getChangedFields(original, { ...original, name: 'Grace' }, ['email'])).toEqual({});
  });
});
