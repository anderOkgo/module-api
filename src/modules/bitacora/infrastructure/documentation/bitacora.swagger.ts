/**
 * Swagger documentation of the Bitácora module. The source of truth is
 * module-docs/apps/bitacora/SPEC.md §3.2; keep this in step with it.
 */

const security = [{ bearerAuth: [] }];
const tags = ['Bitacora'];

const dateParam = {
  name: 'date',
  in: 'path',
  required: true,
  description: 'Calendar date YYYY-MM-DD, from 1900-01-01 to one day after the server UTC date',
  schema: { type: 'string', example: '2026-10-31' },
};

const entrySchema = {
  type: 'object',
  properties: {
    date: { type: 'string', example: '2026-10-31' },
    body: { type: 'string' },
    modified: { type: 'string', description: 'UTC ISO timestamp', example: '2026-10-31T23:40:12Z' },
    version: { type: 'integer', description: '1 on create, +1 on every write', example: 3 },
  },
};

const envelope = (data: object, description: string) => ({
  description,
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: { success: { type: 'boolean' }, message: { type: 'string' }, data },
      },
    },
  },
});

const failure = (description: string) => ({
  description,
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
          errors: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
});

const jsonBody = (properties: object, required: string[]) => ({
  required: true,
  content: { 'application/json': { schema: { type: 'object', required, properties } } },
});

const BAD_REQUEST = failure('Invalid date or request body');
const UNAUTHORIZED = failure('Missing or invalid token, or token without userId');
const NOT_FOUND = failure('Not found');
const conflict = (description: string) => envelope(entrySchema, description);

/** The diary routes (C2–C14); each one also needs the key header, added at the end of this file. */
const diaryDocumentation = {
  getHome: {
    '/api/bitacora/home/{date}': {
      get: {
        summary: "Home: the day's entry, previous day, and 'on this day' in other years",
        tags,
        security,
        parameters: [dateParam],
        responses: {
          200: envelope(
            {
              type: 'object',
              properties: {
                date: { type: 'string' },
                entry: { ...entrySchema, nullable: true },
                previousDay: {
                  type: 'object',
                  properties: { date: { type: 'string' }, written: { type: 'boolean' } },
                },
                onThisDay: {
                  type: 'array',
                  items: { allOf: [entrySchema, { properties: { yearsAgo: { type: 'integer' } } }] },
                },
              },
            },
            'Home data'
          ),
          400: BAD_REQUEST,
          401: UNAUTHORIZED,
        },
      },
    },
  },
  getNearby: {
    '/api/bitacora/entries/{date}/nearby': {
      get: {
        summary: 'Entries of other years within ±3 days (exact matches excluded)',
        tags,
        security,
        parameters: [dateParam],
        responses: {
          200: envelope(
            {
              type: 'array',
              items: {
                allOf: [
                  entrySchema,
                  { properties: { yearsAgo: { type: 'integer' }, offsetDays: { type: 'integer' } } },
                ],
              },
            },
            'Nearby entries, by year (newest first) then offset'
          ),
          400: BAD_REQUEST,
          401: UNAUTHORIZED,
        },
      },
    },
  },
  entry: {
    '/api/bitacora/entries/{date}': {
      get: {
        summary: 'Get the entry of a date',
        tags,
        security,
        parameters: [dateParam],
        responses: { 200: envelope(entrySchema, 'The entry'), 400: BAD_REQUEST, 401: UNAUTHORIZED, 404: NOT_FOUND },
      },
      put: {
        summary: 'Create or replace the entry of a date (optimistic concurrency)',
        tags,
        security,
        parameters: [dateParam],
        requestBody: jsonBody(
          {
            body: { type: 'string', description: '1-100,000 characters after trim' },
            baseVersion: { type: 'integer', nullable: true, description: 'Version last seen; null if none' },
          },
          ['body', 'baseVersion']
        ),
        responses: {
          200: envelope(entrySchema, 'Replaced'),
          201: envelope(entrySchema, 'Created'),
          400: BAD_REQUEST,
          401: UNAUTHORIZED,
          409: conflict('Changed elsewhere: data is the stored entry; nothing was written'),
        },
      },
      delete: {
        summary: 'Move the entry of a date to the trash (recoverable for 30 days)',
        tags,
        security,
        parameters: [dateParam],
        responses: {
          200: envelope(
            { type: 'object', properties: { date: { type: 'string' }, purgeOn: { type: 'string' } } },
            'Moved to the trash'
          ),
          400: BAD_REQUEST,
          401: UNAUTHORIZED,
          404: NOT_FOUND,
        },
      },
    },
  },
  listMonth: {
    '/api/bitacora/entries': {
      get: {
        summary: 'Dates of a month that have an entry',
        tags,
        security,
        parameters: [
          { name: 'month', in: 'query', required: true, schema: { type: 'string', example: '2026-10' } },
        ],
        responses: {
          200: envelope(
            {
              type: 'object',
              properties: { month: { type: 'string' }, dates: { type: 'array', items: { type: 'string' } } },
            },
            'Dates, ascending'
          ),
          400: BAD_REQUEST,
          401: UNAUTHORIZED,
        },
      },
    },
  },
  importEntries: {
    '/api/bitacora/entries/import': {
      post: {
        summary: 'Bulk load of the migrated history (all or nothing, max 1,000 items)',
        tags,
        security,
        requestBody: jsonBody(
          {
            entries: {
              type: 'array',
              items: { type: 'object', properties: { date: { type: 'string' }, body: { type: 'string' } } },
            },
            onConflict: { type: 'string', enum: ['skip', 'overwrite'] },
          },
          ['entries', 'onConflict']
        ),
        responses: {
          200: envelope(
            {
              type: 'object',
              properties: {
                created: { type: 'array', items: { type: 'string' } },
                overwritten: { type: 'array', items: { type: 'string' } },
                skipped: { type: 'array', items: { type: 'string' } },
              },
            },
            'Dates created, overwritten and skipped'
          ),
          400: BAD_REQUEST,
          401: UNAUTHORIZED,
        },
      },
    },
  },
  listTrash: {
    '/api/bitacora/trash': {
      get: {
        summary: 'Entries deleted in the last 30 days, newest deletion first',
        tags,
        security,
        responses: {
          200: envelope(
            {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  date: { type: 'string' },
                  preview: { type: 'string', description: 'First 140 characters' },
                  deletedAt: { type: 'string' },
                  purgeOn: { type: 'string' },
                },
              },
            },
            'Trash'
          ),
          401: UNAUTHORIZED,
        },
      },
    },
  },
  restoreEntry: {
    '/api/bitacora/trash/{date}/restore': {
      post: {
        summary: 'Restore the newest deleted entry of a date',
        tags,
        security,
        parameters: [dateParam],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { onConflict: { type: 'string', enum: ['fail', 'replace', 'keepBoth'], default: 'fail' } },
              },
            },
          },
        },
        responses: {
          200: envelope(entrySchema, 'Restored entry'),
          400: BAD_REQUEST,
          401: UNAUTHORIZED,
          404: failure('Not in the trash, or deleted more than 30 days ago'),
          409: conflict('The date has a new entry and onConflict is "fail": data is the current entry'),
        },
      },
    },
  },
  searchEntries: {
    '/api/bitacora/search': {
      post: {
        summary: 'Find the days whose text holds every word and phrase of a query',
        description:
          'Terms: each "…" pair is a phrase, the rest is split on whitespace; terms under 2 characters are ' +
          'dropped; at most 10. Case- and accent-blind; %, _ and \\ are literal. Newest first, 50 per page. ' +
          'POST so the query, which is diary text, never appears in a URL (SPEC v1.10, N2).',
        tags,
        security,
        requestBody: jsonBody(
          {
            q: { type: 'string', minLength: 2, maxLength: 200, example: 'melgar "the beach"' },
            offset: { type: 'integer', minimum: 0, default: 0 },
          },
          ['q']
        ),
        responses: {
          200: envelope(
            {
              type: 'object',
              properties: {
                total: { type: 'integer', example: 12 },
                offset: { type: 'integer', example: 0 },
                results: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      date: { type: 'string', example: '2026-03-03' },
                      snippet: {
                        type: 'string',
                        description: 'Up to 200 characters around the first match of the first term, … where cut',
                      },
                    },
                  },
                },
              },
            },
            'Matching days, newest first'
          ),
          400: failure('q is not 2–200 characters, holds no term or more than 10, or offset is not an integer ≥ 0'),
          401: UNAUTHORIZED,
        },
      },
    },
  },
};

/* ------------------------------------------------------------------ Diary key (SPEC v1.11 §3.5) */

const keyHeader = (name: string, description: string) => ({
  name,
  in: 'header',
  required: true,
  description,
  schema: { type: 'string', description: '32 bytes in unpadded base64url (43 characters)' },
});
const KEY_PARAM = keyHeader(
  'X-Bitacora-Key',
  'The key the device derived from the passphrase (PBKDF2-SHA256). Never the passphrase; never logged'
);
const NEW_KEY_PARAM = keyHeader('X-Bitacora-New-Key', 'The key derived from the new passphrase');
const KEY_REFUSED = failure('KEY_NOT_SET: the account has no key yet · KEY_REQUIRED: no key header, or malformed');
const KEY_WRONG = failure('KEY_WRONG: the header does not open the account key; nothing read or written');

const keyParamsSchema = {
  type: 'object',
  properties: {
    kdf: { type: 'string', example: 'PBKDF2-SHA256' },
    iterations: { type: 'integer', example: 600000 },
    salt: { type: 'string', description: '16 bytes in unpadded base64url, made on the device' },
  },
};
const keyParamsBody = jsonBody(
  {
    iterations: { type: 'integer', minimum: 600000, maximum: 10000000, example: 600000 },
    salt: { type: 'string', description: '16 random bytes in unpadded base64url, made on the device' },
  },
  ['iterations', 'salt']
);
const BAD_KEY_PARAMS = failure('iterations outside 600,000–10,000,000, salt not 16 bytes, or a key header malformed');

const keyDocumentation = {
  key: {
    '/api/bitacora/key': {
      get: {
        summary: 'Whether the account has a diary key, and how a device derives it (C16)',
        tags,
        security,
        responses: {
          200: envelope(keyParamsSchema, 'Key parameters (never the key)'),
          401: UNAUTHORIZED,
          404: failure('KEY_NOT_SET: the account has no diary key yet'),
        },
      },
      post: {
        summary: 'Create the account diary key once (C15)',
        tags,
        security,
        parameters: [KEY_PARAM],
        requestBody: keyParamsBody,
        responses: {
          201: envelope(keyParamsSchema, 'Key created'),
          400: BAD_KEY_PARAMS,
          401: UNAUTHORIZED,
          409: failure('The account already has a diary key'),
        },
      },
      put: {
        summary: 'Change the passphrase: the data key is re-wrapped, no entry is re-encrypted (C17)',
        tags,
        security,
        parameters: [KEY_PARAM, NEW_KEY_PARAM],
        requestBody: keyParamsBody,
        responses: {
          200: envelope(keyParamsSchema, 'Key changed'),
          400: BAD_KEY_PARAMS,
          401: UNAUTHORIZED,
          403: KEY_WRONG,
          428: KEY_REFUSED,
        },
      },
    },
  },
};

type OperationDoc = { parameters?: object[]; responses: Record<string, unknown> };

/** Adds the key header and the 403/428 answers to every operation of the diary routes. */
function withDiaryKey<T extends Record<string, Record<string, Record<string, OperationDoc>>>>(docs: T): T {
  const result: Record<string, Record<string, Record<string, OperationDoc>>> = {};
  for (const [name, paths] of Object.entries(docs)) {
    result[name] = {};
    for (const [path, operations] of Object.entries(paths)) {
      result[name][path] = {};
      for (const [method, operation] of Object.entries(operations)) {
        result[name][path][method] = {
          ...operation,
          parameters: [...(operation.parameters ?? []), KEY_PARAM],
          responses: { ...operation.responses, 403: KEY_WRONG, 428: KEY_REFUSED },
        };
      }
    }
  }
  return result as T;
}

export const bitacoraSwaggerDocumentation = {
  ...withDiaryKey(diaryDocumentation as unknown as Record<string, Record<string, Record<string, OperationDoc>>>),
  ...keyDocumentation,
} as typeof diaryDocumentation & typeof keyDocumentation;
