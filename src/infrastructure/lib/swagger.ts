import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Animecream API',
      version: '2.0.9',
      description: 'API para gestión de series de anime con funcionalidades CRUD y manejo de imágenes optimizadas',
      contact: {
        name: 'Anderokgo',
        email: 'support@animecream.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Servidor de desarrollo',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Series: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: 'ID único de la serie',
            },
            production_name: {
              type: 'string',
              description: 'Nombre de la producción',
            },
            production_number_chapters: {
              type: 'array',
              items: {
                type: 'number',
              },
              description: 'Número de capítulos',
            },
            production_description: {
              type: 'string',
              description: 'Descripción de la producción',
            },
            production_year: {
              type: 'array',
              items: {
                type: 'number',
              },
              description: 'Año de producción',
            },
            demographic_name: {
              type: 'string',
              description: 'Nombre de la demografía',
            },
            genre_names: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Nombres de géneros',
            },
            image: {
              type: 'string',
              description: 'Ruta de la imagen optimizada',
            },
            qualification: {
              type: 'number',
              minimum: 0,
              maximum: 10,
              description: 'Calificación de 0 a 10',
            },
            demography_id: {
              type: 'number',
              description: 'ID de la demografía',
            },
            visible: {
              type: 'boolean',
              description: 'Si la serie es visible',
            },
            rank: {
              type: 'number',
              description: 'Ranking de la serie',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de última actualización',
            },
          },
        },
        SeriesCreateRequest: {
          type: 'object',
          required: ['name', 'chapter_number', 'year', 'description', 'qualification', 'demography_id', 'visible'],
          properties: {
            name: {
              type: 'string',
              description: 'Nombre de la serie',
              example: 'Attack on Titan',
            },
            chapter_number: {
              type: 'number',
              minimum: 1,
              description: 'Número de capítulos',
              example: 25,
            },
            year: {
              type: 'number',
              minimum: 1900,
              maximum: 2030,
              description: 'Año de lanzamiento',
              example: 2013,
            },
            description: {
              type: 'string',
              description: 'Descripción de la serie',
              example: 'Una serie de anime sobre la humanidad luchando contra titanes',
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
              minimum: 1,
              description: 'ID de la demografía',
              example: 1,
            },
            visible: {
              type: 'boolean',
              description: 'Si la serie es visible',
              example: true,
            },
          },
        },
        SeriesUpdateRequest: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: 'ID de la serie a actualizar',
            },
            name: {
              type: 'string',
              description: 'Nombre de la serie',
            },
            chapter_number: {
              type: 'number',
              minimum: 1,
              description: 'Número de capítulos',
            },
            year: {
              type: 'number',
              minimum: 1900,
              maximum: 2030,
              description: 'Año de lanzamiento',
            },
            description: {
              type: 'string',
              description: 'Descripción de la serie',
            },
            qualification: {
              type: 'number',
              minimum: 0,
              maximum: 10,
              description: 'Calificación de 0 a 10',
            },
            demography_id: {
              type: 'number',
              minimum: 1,
              description: 'ID de la demografía',
            },
            visible: {
              type: 'boolean',
              description: 'Si la serie es visible',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Mensaje de error',
            },
            details: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Detalles del error',
            },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Mensaje de éxito',
            },
            data: {
              type: 'object',
              description: 'Datos de respuesta',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    './src/modules/auth/infrastructure/controllers/*.ts',
    './src/modules/finan/infrastructure/controllers/*.ts',
    './src/modules/series/infrastructure/controllers/*.ts',
    './src/server.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
export default swaggerSpec;
