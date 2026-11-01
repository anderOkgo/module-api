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

export const bitacoraSwaggerDocumentation = {
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
};
