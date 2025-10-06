/**
 * COMPLETE Swagger documentation for the series module
 * Separated from controller to keep code clean
 */

export const seriesSwaggerDocumentation = {
  // 1. GET /api/series (POST) - Boot endpoint to get productions with filters
  getProductions: {
    '/api/series': {
      post: {
        summary: 'Get productions with filters (Boot endpoint)',
        tags: ['Series'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  production_name: {
                    type: 'string',
                    description: 'Production name (partial search)',
                    example: 'Attack on Titan',
                  },
                  production_year: {
                    type: 'array',
                    items: {
                      type: 'number',
                    },
                    description: 'Production years to filter',
                    example: [2013, 2014, 2015],
                  },
                  demographic_name: {
                    type: 'string',
                    description: 'Demographic name',
                    example: 'Shōnen',
                  },
                  limit: {
                    type: 'string',
                    description: 'Results limit',
                    example: '50',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Production list obtained successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/Series',
                  },
                },
              },
            },
          },
          400: {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          500: {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
  },

  // 2. GET /api/series/years - Get available production years
  getProductionYears: {
    '/api/series/years': {
      get: {
        summary: 'Get all available production years',
        tags: ['Series'],
        responses: {
          200: {
            description: 'Years list obtained successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: {
                        type: 'number',
                      },
                      example: [2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
                    },
                  },
                },
              },
            },
          },
          500: {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
  },

  // 3. POST /api/series/create - Create series with multipart/form-data
  createSeries: {
    '/api/series/create': {
      post: {
        summary: 'Create a new series',
        tags: ['Series'],
        security: [
          {
            bearerAuth: [],
          },
        ],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: [
                  'name',
                  'chapter_number',
                  'year',
                  'description',
                  'qualification',
                  'demography_id',
                  'visible',
                ],
                properties: {
                  name: {
                    type: 'string',
                    description: 'Series name',
                    example: 'Attack on Titan',
                  },
                  chapter_number: {
                    type: 'number',
                    description: 'Number of chapters',
                    example: 25,
                  },
                  year: {
                    type: 'number',
                    description: 'Release year',
                    example: 2013,
                  },
                  description: {
                    type: 'string',
                    description: 'Series description',
                    example: 'Una serie de anime sobre la humanidad luchando contra titanes',
                  },
                  description_en: {
                    type: 'string',
                    description: 'Series description in English',
                    example: 'An anime series about humanity fighting against titans',
                  },
                  qualification: {
                    type: 'number',
                    minimum: 0,
                    maximum: 10,
                    description: 'Rating from 0 to 10',
                    example: 9.5,
                  },
                  demography_id: {
                    type: 'number',
                    description: 'Demographic ID',
                    example: 1,
                  },
                  visible: {
                    type: 'boolean',
                    description: 'Whether the series is visible',
                    example: true,
                  },
                  image: {
                    type: 'string',
                    format: 'binary',
                    description: 'Series image (will be optimized to 190x285px, ~14KB)',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Series created successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    {
                      $ref: '#/components/schemas/SuccessResponse',
                    },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          $ref: '#/components/schemas/Series',
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          400: {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          500: {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
  },

  // 4. POST /api/series/create-complete - Create complete series with JSON
  createSeriesComplete: {
    '/api/series/create-complete': {
      post: {
        summary: 'Create complete series with relationships (JSON)',
        tags: ['Series'],
        security: [
          {
            bearerAuth: [],
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: [
                  'name',
                  'chapter_number',
                  'year',
                  'description',
                  'qualification',
                  'demography_id',
                  'visible',
                ],
                properties: {
                  name: {
                    type: 'string',
                    description: 'Series name',
                    example: 'Attack on Titan',
                  },
                  chapter_number: {
                    type: 'number',
                    description: 'Number of chapters',
                    example: 25,
                  },
                  year: {
                    type: 'number',
                    description: 'Release year',
                    example: 2013,
                  },
                  description: {
                    type: 'string',
                    description: 'Series description',
                    example: 'Una serie de anime sobre la humanidad luchando contra titanes',
                  },
                  description_en: {
                    type: 'string',
                    description: 'Series description in English',
                    example: 'An anime series about humanity fighting against titans',
                  },
                  qualification: {
                    type: 'number',
                    minimum: 0,
                    maximum: 10,
                    description: 'Rating from 0 to 10',
                    example: 9.5,
                  },
                  demography_id: {
                    type: 'number',
                    description: 'Demographic ID',
                    example: 2,
                  },
                  visible: {
                    type: 'boolean',
                    description: 'Whether the series is visible',
                    example: true,
                  },
                  genres: {
                    type: 'array',
                    items: {
                      type: 'number',
                    },
                    description: 'Array of genre IDs',
                    example: [1, 3, 5],
                  },
                  titles: {
                    type: 'array',
                    items: {
                      type: 'string',
                    },
                    description: 'Array of alternative titles',
                    example: ['Shingeki no Kyojin', 'AOT'],
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Series created successfully with relationships',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    {
                      $ref: '#/components/schemas/SuccessResponse',
                    },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          $ref: '#/components/schemas/Series',
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          400: {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          500: {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
  },

  // 5. GET /api/series/{id} - Get series by ID
  getSeriesById: {
    '/api/series/{id}': {
      get: {
        summary: 'Get series by ID',
        tags: ['Series'],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: {
              type: 'integer',
            },
            description: 'Series ID',
            example: 1,
          },
        ],
        responses: {
          200: {
            description: 'Series obtained successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      $ref: '#/components/schemas/Series',
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'Invalid ID',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          404: {
            description: 'Series not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          500: {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
  },

  // 6. PUT /api/series/{id}/image - Update series image
  updateSeriesImage: {
    '/api/series/{id}/image': {
      put: {
        summary: 'Update a series image',
        tags: ['Series'],
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: {
              type: 'integer',
            },
            description: 'Series ID',
            example: 1,
          },
        ],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  image: {
                    type: 'string',
                    format: 'binary',
                    description: 'New series image',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Image updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: {
                      type: 'boolean',
                      example: false,
                    },
                    message: {
                      type: 'string',
                      example: 'Image updated successfully',
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          401: {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          500: {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
  },

  // 7. GET /api/series/list - Get all series
  getAllSeries: {
    '/api/series/list': {
      get: {
        summary: 'Get all series',
        tags: ['Series'],
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            in: 'query',
            name: 'limit',
            schema: {
              type: 'integer',
              default: 50,
              minimum: 1,
              maximum: 100,
            },
            description: 'Maximum number of series to return',
            example: 25,
          },
          {
            in: 'query',
            name: 'offset',
            schema: {
              type: 'integer',
              default: 0,
              minimum: 0,
            },
            description: 'Number of series to skip (for pagination)',
            example: 0,
          },
        ],
        responses: {
          200: {
            description: 'Series list obtained successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Series',
                      },
                    },
                  },
                },
              },
            },
          },
          500: {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
  },

  // 8. PUT /api/series/{id} - Update series
  updateSeries: {
    '/api/series/{id}': {
      put: {
        summary: 'Update existing series',
        tags: ['Series'],
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: {
              type: 'integer',
            },
            description: 'Series ID to update',
            example: 1,
          },
        ],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                    description: 'Series name (optional)',
                    example: '',
                  },
                  chapter_number: {
                    type: 'number',
                    description: 'Number of chapters (optional)',
                    example: '',
                  },
                  year: {
                    type: 'number',
                    description: 'Release year (optional)',
                    example: '',
                  },
                  description: {
                    type: 'string',
                    description: 'Series description (optional)',
                    example: '',
                  },
                  description_en: {
                    type: 'string',
                    description: 'Series description in English (optional)',
                    example: '',
                  },
                  qualification: {
                    type: 'number',
                    minimum: 0,
                    maximum: 10,
                    description: 'Rating from 0 to 10 (optional)',
                    example: '',
                  },
                  demography_id: {
                    type: 'number',
                    description: 'Demographic ID (optional)',
                    example: '',
                  },
                  visible: {
                    type: 'boolean',
                    description: 'Whether the series is visible (optional)',
                    example: '',
                  },
                  image: {
                    type: 'string',
                    format: 'binary',
                    description: 'New series image (optional)',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Series updated successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    {
                      $ref: '#/components/schemas/SuccessResponse',
                    },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          $ref: '#/components/schemas/Series',
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          400: {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          500: {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
  },

  // 9. DELETE /api/series/{id} - Delete series
  deleteSeries: {
    '/api/series/{id}': {
      delete: {
        summary: 'Delete series',
        tags: ['Series'],
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: {
              type: 'integer',
            },
            description: 'Series ID to delete',
            example: 1,
          },
        ],
        responses: {
          200: {
            description: 'Series deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Series deleted successfully',
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'Invalid ID',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          404: {
            description: 'Series not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          500: {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
  },

  // 10. POST /api/series/search - Search series with filters
  searchSeries: {
    '/api/series/search': {
      post: {
        summary: 'Search series with filters',
        tags: ['Series'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  production_name: {
                    type: 'string',
                    description: 'Series name (partial search)',
                    example: 'Attack on Titan',
                  },
                  production_year: {
                    type: 'number',
                    description: 'Production year',
                    example: 2013,
                  },
                  demography_id: {
                    type: 'number',
                    description:
                      'Demographic ID (1=Kodomo, 2=Shōnen, 3=Shōjo, 4=Seinen, 5=Josei, 6=Shōnen-Seinen)',
                    example: 2,
                  },
                  visible: {
                    type: 'boolean',
                    description: 'Whether the series is visible',
                    example: true,
                  },
                  qualification: {
                    type: 'number',
                    description: 'Minimum rating (0-10)',
                    example: 8.5,
                  },
                  chapter_number: {
                    type: 'number',
                    description: 'Number of chapters',
                    example: 25,
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Search completed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Series',
                      },
                    },
                  },
                },
              },
            },
          },
          500: {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
  },

  // 11. POST /api/series/{id}/genres - Assign genres
  assignGenres: {
    '/api/series/{id}/genres': {
      post: {
        summary: 'Assign genres to a series',
        tags: ['Series'],
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: {
              type: 'integer',
            },
            description: 'Series ID',
            example: 1,
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['genres'],
                properties: {
                  genres: {
                    type: 'array',
                    items: {
                      type: 'number',
                    },
                    description: 'Array of genre IDs',
                    example: [1, 3, 5],
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Genres assigned successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Genres assigned successfully',
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          500: {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
  },

  // 12. DELETE /api/series/{id}/genres - Remove genres
  removeGenres: {
    '/api/series/{id}/genres': {
      delete: {
        summary: 'Remove genres from a series',
        tags: ['Series'],
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: {
              type: 'integer',
            },
            description: 'Series ID',
            example: 1,
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['genres'],
                properties: {
                  genres: {
                    type: 'array',
                    items: {
                      type: 'number',
                    },
                    description: 'Array of genre IDs to remove',
                    example: [1, 3],
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Genres removed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Genres removed successfully',
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          500: {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
  },

  // 13. POST /api/series/{id}/titles - Add titles
  addTitles: {
    '/api/series/{id}/titles': {
      post: {
        summary: 'Add alternative titles to a series',
        tags: ['Series'],
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: {
              type: 'integer',
            },
            description: 'Series ID',
            example: 1,
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['titles'],
                properties: {
                  titles: {
                    type: 'array',
                    items: {
                      type: 'string',
                    },
                    description: 'Array of alternative titles',
                    example: ['Shingeki no Kyojin', 'AOT'],
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Titles added successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Titles added successfully',
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          500: {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
  },

  // 14. DELETE /api/series/{id}/titles - Remove titles
  removeTitles: {
    '/api/series/{id}/titles': {
      delete: {
        summary: 'Remove alternative titles from a series',
        tags: ['Series'],
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: {
              type: 'integer',
            },
            description: 'Series ID',
            example: 1,
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['titleIds'],
                properties: {
                  titleIds: {
                    type: 'array',
                    items: {
                      type: 'number',
                    },
                    description: 'Array of title IDs to remove',
                    example: [1, 2],
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Titles removed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Titles removed successfully',
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          500: {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
  },

  // 15. GET /api/series/genres - Get available genres
  getGenres: {
    '/api/series/genres': {
      get: {
        summary: 'Get list of available genres',
        tags: ['Series'],
        responses: {
          200: {
            description: 'Genres list obtained successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Genres obtained successfully',
                    },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: {
                            type: 'number',
                            example: 1,
                          },
                          name: {
                            type: 'string',
                            example: 'Acción',
                          },
                          slug: {
                            type: 'string',
                            example: 'accion',
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          500: {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
  },

  // 16. GET /api/series/demographics - Get available demographics
  getDemographics: {
    '/api/series/demographics': {
      get: {
        summary: 'Get list of available demographics',
        tags: ['Series'],
        responses: {
          200: {
            description: 'Demographics list obtained successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Demographics obtained successfully',
                    },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: {
                            type: 'number',
                            example: 1,
                          },
                          name: {
                            type: 'string',
                            example: 'Shounen',
                          },
                          slug: {
                            type: 'string',
                            example: 'shounen',
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          500: {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
  },
};
