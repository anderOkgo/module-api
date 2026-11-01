import {
  charCount,
  checkBaseVersion,
  checkBody,
  checkImport,
  checkRestorePolicy,
  MAX_BODY_CHARS,
  MAX_IMPORT_ITEMS,
} from '../../../../../src/modules/bitacora/domain/services/entry-rules';

const NOW = new Date('2026-10-31T12:00:00Z');

describe('entry-rules', () => {
  describe('checkBody (A5, A6, A7)', () => {
    it('trims the text', () => {
      expect(checkBody('  Long day.\n')).toEqual({ ok: true, value: 'Long day.' });
    });

    it.each([
      ['', 'body must not be empty'],
      ['   \n\t ', 'body must not be empty'],
      [42, 'body must be a string'],
      [undefined, 'body must be a string'],
    ])('rejects %p', (raw, error) => {
      expect(checkBody(raw)).toEqual({ ok: false, errors: [error] });
    });

    it('accepts exactly 100,000 characters and rejects 100,001', () => {
      expect(checkBody('a'.repeat(MAX_BODY_CHARS)).ok).toBe(true);
      expect(checkBody('a'.repeat(MAX_BODY_CHARS + 1))).toEqual({
        ok: false,
        errors: ['body must be at most 100000 characters'],
      });
    });

    it('counts an emoji as one character, as MariaDB does', () => {
      expect(charCount('ñá😀')).toBe(3);
      expect(checkBody('😀'.repeat(MAX_BODY_CHARS)).ok).toBe(true);
    });

    it('names the field in the error', () => {
      expect(checkBody('', 'entries[2].body')).toEqual({ ok: false, errors: ['entries[2].body must not be empty'] });
    });
  });

  describe('checkBaseVersion', () => {
    it('accepts null and positive integers', () => {
      expect(checkBaseVersion(null)).toEqual({ ok: true, value: null });
      expect(checkBaseVersion(3)).toEqual({ ok: true, value: 3 });
    });

    it.each([undefined, 0, -1, 1.5, '3'])('rejects %p', (raw) => {
      expect(checkBaseVersion(raw).ok).toBe(false);
    });
  });

  describe('checkRestorePolicy', () => {
    it('defaults to "fail"', () => {
      expect(checkRestorePolicy(undefined)).toEqual({ ok: true, value: 'fail' });
    });

    it.each(['fail', 'replace', 'keepBoth'])('accepts %s', (policy) => {
      expect(checkRestorePolicy(policy)).toEqual({ ok: true, value: policy });
    });

    it('rejects anything else', () => {
      expect(checkRestorePolicy('merge').ok).toBe(false);
    });
  });

  describe('checkImport (L1, L2)', () => {
    const item = (date: string, body = 'Text') => ({ date, body });

    it('returns trimmed items and the policy', () => {
      expect(checkImport({ entries: [item('2019-03-04', ' A ')], onConflict: 'skip' }, NOW)).toEqual({
        ok: true,
        value: { items: [{ date: '2019-03-04', body: 'A' }], onConflict: 'skip' },
      });
    });

    it('rejects a missing payload, an empty list and more than 1,000 items', () => {
      expect(checkImport(undefined, NOW).ok).toBe(false);
      expect(checkImport({ entries: [], onConflict: 'skip' }, NOW)).toEqual({
        ok: false,
        errors: ['entries must be an array of 1 to 1000 items'],
      });
      const tooMany = Array.from({ length: MAX_IMPORT_ITEMS + 1 }, (_, i) => item(`2000-01-01`, String(i)));
      expect(checkImport({ entries: tooMany, onConflict: 'skip' }, NOW).ok).toBe(false);
    });

    it('rejects an unknown policy', () => {
      expect(checkImport({ entries: [item('2019-03-04')], onConflict: 'merge' }, NOW)).toEqual({
        ok: false,
        errors: ['onConflict must be one of: skip, overwrite'],
      });
    });

    it('lists every invalid item and rejects the whole batch', () => {
      const result = checkImport(
        {
          entries: [item('2019-03-04'), item('2019-02-30'), item('2019-03-04'), item('2019-03-05', '  '), null],
          onConflict: 'overwrite',
        },
        NOW
      );
      expect(result).toEqual({
        ok: false,
        errors: [
          'entries[1].date is not a valid date',
          'entries[2].date is repeated',
          'entries[3].body must not be empty',
          'entries[4].date is not a valid date',
          'entries[4].body must be a string',
        ],
      });
    });
  });
});
