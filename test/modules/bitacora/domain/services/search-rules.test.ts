import {
  checkSearch,
  likePattern,
  SEARCH_MAX_TERMS,
  searchSnippet,
  searchTerms,
  SNIPPET_CHARS,
} from '../../../../../src/modules/bitacora/domain/services/entry-rules';

describe('search rules (C14, SPEC v1.10)', () => {
  describe('searchTerms', () => {
    it('splits words on whitespace', () => {
      expect(searchTerms('melgar   beach\tsun')).toEqual(['melgar', 'beach', 'sun']);
    });

    it('keeps a quoted phrase as one term, trimmed (Q2)', () => {
      expect(searchTerms('"left for" melgar "  the beach "')).toEqual(['left for', 'melgar', 'the beach']);
    });

    it('reads an unmatched quote as a plain character', () => {
      expect(searchTerms('"left for')).toEqual(['"left', 'for']);
    });

    it('drops terms shorter than 2 characters, counting an emoji once', () => {
      expect(searchTerms('a I go 😀 😀😀')).toEqual(['go', '😀😀']);
    });
  });

  describe('checkSearch (Q5)', () => {
    it('returns the terms and offset 0 by default', () => {
      expect(checkSearch({ q: '  melgar beach ' })).toEqual({ ok: true, value: { terms: ['melgar', 'beach'], offset: 0 } });
    });

    it('accepts an offset', () => {
      expect(checkSearch({ q: 'melgar', offset: 50 })).toEqual({ ok: true, value: { terms: ['melgar'], offset: 50 } });
    });

    it.each([
      ['missing body', undefined, 'q must be a string'],
      ['missing q', {}, 'q must be a string'],
      ['a number', { q: 7 }, 'q must be a string'],
      ['empty', { q: '   ' }, 'q must be 2 to 200 characters'],
      ['one character', { q: 'a' }, 'q must be 2 to 200 characters'],
      ['201 characters', { q: 'x'.repeat(201) }, 'q must be 2 to 200 characters'],
      ['no term left', { q: 'a b' }, 'q must hold a word or phrase of at least 2 characters'],
      ['11 terms', { q: Array.from({ length: SEARCH_MAX_TERMS + 1 }, (_, i) => `w${i}`).join(' ') }, 'q must hold at most 10 words or phrases'],
    ])('rejects %s', (_name, raw, message) => {
      expect(checkSearch(raw)).toEqual({ ok: false, errors: [message] });
    });

    it('accepts exactly 200 characters and 10 terms', () => {
      expect(checkSearch({ q: 'x'.repeat(200) }).ok).toBe(true);
      expect(checkSearch({ q: Array.from({ length: SEARCH_MAX_TERMS }, (_, i) => `w${i}`).join(' ') }).ok).toBe(true);
    });

    it.each([[-1], [1.5], ['x'], [null]])('rejects offset %p', (offset) => {
      expect(checkSearch({ q: 'melgar', offset })).toEqual({ ok: false, errors: ['offset must be an integer of 0 or more'] });
    });

    it('never echoes the query in an error (N2)', () => {
      const result = checkSearch({ q: 'secretword '.repeat(30), offset: -1 });
      expect(JSON.stringify(result)).not.toContain('secretword');
    });
  });

  describe('likePattern (Q4)', () => {
    it('wraps the term in % and escapes \\, % and _', () => {
      expect(likePattern('melgar')).toBe('%melgar%');
      expect(likePattern('100%')).toBe('%100\\%%');
      expect(likePattern('a_b')).toBe('%a\\_b%');
      expect(likePattern('c:\\dir')).toBe('%c:\\\\dir%');
    });
  });

  describe('searchSnippet', () => {
    const long = `${'Start of the day. '.repeat(10)}Then I left for Melgar with my brother.${' We swam all day.'.repeat(12)}`;

    it('returns a short body whole, with line breaks as spaces', () => {
      expect(searchSnippet('Back from Melgar.\n\nTired  but happy.', 'melgar')).toBe('Back from Melgar. Tired but happy.');
    });

    it('cuts around the first match, with ellipses, at most 200 characters of body', () => {
      const snippet = searchSnippet(long, 'melgar');
      expect(snippet.startsWith('…')).toBe(true);
      expect(snippet.endsWith('…')).toBe(true);
      expect(snippet).toContain('Melgar');
      expect([...snippet].length).toBe(SNIPPET_CHARS + 2);
      expect(snippet.indexOf('Melgar')).toBeGreaterThan(50);
    });

    it('keeps 200 characters when the match is near the end', () => {
      const body = `${'a'.repeat(300)} Melgar`;
      const snippet = searchSnippet(body, 'melgar');
      expect(snippet.startsWith('…')).toBe(true);
      expect(snippet.endsWith('Melgar')).toBe(true);
      expect([...snippet].length).toBe(SNIPPET_CHARS + 1);
    });

    it('starts at the beginning when the match is near the start', () => {
      expect(searchSnippet(long, 'start').startsWith('Start of the day.')).toBe(true);
    });

    it('finds the match case- and accent-blind (Q3)', () => {
      const body = `${'x'.repeat(250)} Back from Bogotá.`;
      expect(searchSnippet(body, 'BOGOTA')).toContain('Bogotá');
    });

    it('maps the position back through emoji and decomposed letters', () => {
      const body = `${'😀'.repeat(100)}${'é'.normalize('NFD').repeat(50)} Melgar ${'z'.repeat(200)}`;
      const snippet = searchSnippet(body, 'melgar');
      expect(snippet).toContain('Melgar');
      expect(snippet.startsWith('…')).toBe(true);
    });

    it('starts at the beginning when the folding finds no match', () => {
      expect(searchSnippet(`Straße ${'y'.repeat(300)}`, 'strasse').startsWith('Straße')).toBe(true);
    });
  });
});
