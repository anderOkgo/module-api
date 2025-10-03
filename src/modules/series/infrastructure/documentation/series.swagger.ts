/**
 * Documentación Swagger COMPLETA para el módulo de series
 * Separada del controlador para mantener código limpio
 */

export const seriesSwaggerDocumentation = {
  // 1. GET /api/series (POST) - Boot endpoint para obtener producciones con filtros
  getProductions: {
    '/api/series': {
      post: {
        summary: 'Obtener producciones con filtros (Boot endpoint)',
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
                    description: 'Nombre de la producción (búsqueda parcial)',
                    example: 'Attack on Titan',
                  },
                  production_year: {
                    type: 'array',
                    items: {
                      type: 'number',
                    },
                    description: 'Años de producción para filtrar',
                    example: [2013, 2014, 2015],
                  },
                  demographic_name: {
                    type: 'string',
                    description: 'Nombre de la demografía',
                    example: 'Shōnen',
                  },
                  limit: {
                    type: 'string',
                    description: 'Límite de resultados',
                    example: '50',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Lista de producciones obtenida exitosamente',
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
            description: 'Error de validación',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          500: {
            description: 'Error interno del servidor',
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

  // 2. GET /api/series/years - Obtener años de producción disponibles
  getProductionYears: {
    '/api/series/years': {
      get: {
        summary: 'Obtener todos los años de producción disponibles',
        tags: ['Series'],
        responses: {
          200: {
            description: 'Lista de años obtenida exitosamente',
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
            description: 'Error interno del servidor',
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

  // 3. POST /api/series/create - Crear serie con multipart/form-data
  createSeries: {
    '/api/series/create': {
      post: {
        summary: 'Crear una nueva serie',
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
                    description: 'Nombre de la serie',
                    example: 'Attack on Titan',
                  },
                  chapter_number: {
                    type: 'number',
                    description: 'Número de capítulos',
                    example: 25,
                  },
                  year: {
                    type: 'number',
                    description: 'Año de lanzamiento',
                    example: 2013,
                  },
                  description: {
                    type: 'string',
                    description: 'Descripción de la serie',
                    example: 'Una serie de anime sobre la humanidad luchando contra titanes',
                  },
                  description_en: {
                    type: 'string',
                    description: 'Descripción de la serie en inglés',
                    example: 'An anime series about humanity fighting against titans',
                  },
                  qualification: {
                    type: 'number',
                    minimum: 0,
                    maximum: 10,
                    description: 'Calificación de 0 a 10',
                    example: 9.5,
                  },
                  demography_id: {
                    type: 'number',
                    description: 'ID de la demografía',
                    example: 1,
                  },
                  visible: {
                    type: 'boolean',
                    description: 'Si la serie es visible',
                    example: true,
                  },
                  image: {
                    type: 'string',
                    format: 'binary',
                    description: 'Imagen de la serie (será optimizada a 190x285px, ~14KB)',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Serie creada exitosamente',
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
            description: 'Error de validación',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          500: {
            description: 'Error interno del servidor',
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

  // 4. POST /api/series/create-complete - Crear serie completa con JSON
  createSeriesComplete: {
    '/api/series/create-complete': {
      post: {
        summary: 'Crear serie completa con relaciones (JSON)',
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
                    description: 'Nombre de la serie',
                    example: 'Attack on Titan',
                  },
                  chapter_number: {
                    type: 'number',
                    description: 'Número de capítulos',
                    example: 25,
                  },
                  year: {
                    type: 'number',
                    description: 'Año de lanzamiento',
                    example: 2013,
                  },
                  description: {
                    type: 'string',
                    description: 'Descripción de la serie',
                    example: 'Una serie de anime sobre la humanidad luchando contra titanes',
                  },
                  description_en: {
                    type: 'string',
                    description: 'Descripción de la serie en inglés',
                    example: 'An anime series about humanity fighting against titans',
                  },
                  qualification: {
                    type: 'number',
                    minimum: 0,
                    maximum: 10,
                    description: 'Calificación de 0 a 10',
                    example: 9.5,
                  },
                  demography_id: {
                    type: 'number',
                    description: 'ID de la demografía',
                    example: 2,
                  },
                  visible: {
                    type: 'boolean',
                    description: 'Si la serie es visible',
                    example: true,
                  },
                  genres: {
                    type: 'array',
                    items: {
                      type: 'number',
                    },
                    description: 'Array de IDs de géneros',
                    example: [1, 3, 5],
                  },
                  titles: {
                    type: 'array',
                    items: {
                      type: 'string',
                    },
                    description: 'Array de títulos alternativos',
                    example: ['Shingeki no Kyojin', 'AOT'],
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Serie creada exitosamente con relaciones',
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
            description: 'Error de validación',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          500: {
            description: 'Error interno del servidor',
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

  // 5. GET /api/series/{id} - Obtener serie por ID
  getSeriesById: {
    '/api/series/{id}': {
      get: {
        summary: 'Obtener serie por ID',
        tags: ['Series'],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: {
              type: 'integer',
            },
            description: 'ID de la serie',
            example: 1,
          },
        ],
        responses: {
          200: {
            description: 'Serie obtenida exitosamente',
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
            description: 'ID inválido',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          404: {
            description: 'Serie no encontrada',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          500: {
            description: 'Error interno del servidor',
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

  // 6. PUT /api/series/{id}/image - Actualizar imagen de serie
  updateSeriesImage: {
    '/api/series/{id}/image': {
      put: {
        summary: 'Actualizar imagen de una serie',
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
            description: 'ID de la serie',
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
                    description: 'Nueva imagen de la serie',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Imagen actualizada exitosamente',
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
                      example: 'Imagen actualizada exitosamente',
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'Error en la validación',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          401: {
            description: 'No autorizado',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          500: {
            description: 'Error interno del servidor',
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

  // 7. GET /api/series/list - Obtener todas las series
  getAllSeries: {
    '/api/series/list': {
      get: {
        summary: 'Obtener todas las series',
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
            description: 'Número máximo de series a retornar',
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
            description: 'Número de series a omitir (para paginación)',
            example: 0,
          },
        ],
        responses: {
          200: {
            description: 'Lista de series obtenida exitosamente',
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
            description: 'Error interno del servidor',
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

  // 8. PUT /api/series/{id} - Actualizar serie
  updateSeries: {
    '/api/series/{id}': {
      put: {
        summary: 'Actualizar serie existente',
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
            description: 'ID de la serie a actualizar',
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
                    description: 'Nombre de la serie',
                    example: 'Attack on Titan Season 2',
                  },
                  chapter_number: {
                    type: 'number',
                    description: 'Número de capítulos',
                    example: 12,
                  },
                  year: {
                    type: 'number',
                    description: 'Año de lanzamiento',
                    example: 2017,
                  },
                  description: {
                    type: 'string',
                    description: 'Descripción de la serie',
                    example: 'Segunda temporada de Attack on Titan',
                  },
                  description_en: {
                    type: 'string',
                    description: 'Descripción de la serie en inglés',
                    example: 'Second season of Attack on Titan',
                  },
                  qualification: {
                    type: 'number',
                    minimum: 0,
                    maximum: 10,
                    description: 'Calificación de 0 a 10',
                    example: 9.8,
                  },
                  demography_id: {
                    type: 'number',
                    description: 'ID de la demografía',
                    example: 1,
                  },
                  visible: {
                    type: 'boolean',
                    description: 'Si la serie es visible',
                    example: true,
                  },
                  image: {
                    type: 'string',
                    format: 'binary',
                    description: 'Nueva imagen de la serie (opcional)',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Serie actualizada exitosamente',
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
            description: 'Error de validación',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          500: {
            description: 'Error interno del servidor',
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

  // 9. DELETE /api/series/{id} - Eliminar serie
  deleteSeries: {
    '/api/series/{id}': {
      delete: {
        summary: 'Eliminar serie',
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
            description: 'ID de la serie a eliminar',
            example: 1,
          },
        ],
        responses: {
          200: {
            description: 'Serie eliminada exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Serie eliminada exitosamente',
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'ID inválido',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          404: {
            description: 'Serie no encontrada',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          500: {
            description: 'Error interno del servidor',
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

  // 10. POST /api/series/search - Buscar series con filtros
  searchSeries: {
    '/api/series/search': {
      post: {
        summary: 'Buscar series con filtros',
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
                    description: 'Nombre de la serie (búsqueda parcial)',
                    example: 'Attack on Titan',
                  },
                  production_year: {
                    type: 'number',
                    description: 'Año de producción',
                    example: 2013,
                  },
                  demography_id: {
                    type: 'number',
                    description:
                      'ID de la demografía (1=Kodomo, 2=Shōnen, 3=Shōjo, 4=Seinen, 5=Josei, 6=Shōnen-Seinen)',
                    example: 2,
                  },
                  visible: {
                    type: 'boolean',
                    description: 'Si la serie es visible',
                    example: true,
                  },
                  qualification: {
                    type: 'number',
                    description: 'Calificación mínima (0-10)',
                    example: 8.5,
                  },
                  chapter_number: {
                    type: 'number',
                    description: 'Número de capítulos',
                    example: 25,
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Búsqueda realizada exitosamente',
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
            description: 'Error interno del servidor',
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

  // 11. POST /api/series/{id}/genres - Asignar géneros
  assignGenres: {
    '/api/series/{id}/genres': {
      post: {
        summary: 'Asignar géneros a una serie',
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
            description: 'ID de la serie',
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
                    description: 'Array de IDs de géneros',
                    example: [1, 3, 5],
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Géneros asignados exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Géneros asignados exitosamente',
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'Error de validación',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          500: {
            description: 'Error interno del servidor',
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

  // 12. DELETE /api/series/{id}/genres - Remover géneros
  removeGenres: {
    '/api/series/{id}/genres': {
      delete: {
        summary: 'Remover géneros de una serie',
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
            description: 'ID de la serie',
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
                    description: 'Array de IDs de géneros a remover',
                    example: [1, 3],
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Géneros removidos exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Géneros removidos exitosamente',
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'Error de validación',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          500: {
            description: 'Error interno del servidor',
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

  // 13. POST /api/series/{id}/titles - Agregar títulos
  addTitles: {
    '/api/series/{id}/titles': {
      post: {
        summary: 'Agregar títulos alternativos a una serie',
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
            description: 'ID de la serie',
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
                    description: 'Array de títulos alternativos',
                    example: ['Shingeki no Kyojin', 'AOT'],
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Títulos agregados exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Títulos agregados exitosamente',
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'Error de validación',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          500: {
            description: 'Error interno del servidor',
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

  // 14. DELETE /api/series/{id}/titles - Remover títulos
  removeTitles: {
    '/api/series/{id}/titles': {
      delete: {
        summary: 'Remover títulos alternativos de una serie',
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
            description: 'ID de la serie',
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
                    description: 'Array de IDs de títulos a remover',
                    example: [1, 2],
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Títulos removidos exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Títulos removidos exitosamente',
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'Error de validación',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          500: {
            description: 'Error interno del servidor',
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

  // 15. GET /api/series/genres - Obtener géneros disponibles
  getGenres: {
    '/api/series/genres': {
      get: {
        summary: 'Obtener lista de géneros disponibles',
        tags: ['Series'],
        responses: {
          200: {
            description: 'Lista de géneros obtenida exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Géneros obtenidos exitosamente',
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
            description: 'Error interno del servidor',
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

  // 16. GET /api/series/demographics - Obtener demografías disponibles
  getDemographics: {
    '/api/series/demographics': {
      get: {
        summary: 'Obtener lista de demografías disponibles',
        tags: ['Series'],
        responses: {
          200: {
            description: 'Lista de demografías obtenida exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Demografías obtenidas exitosamente',
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
            description: 'Error interno del servidor',
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
