/**
 * Schemas reutilizables de Swagger/OpenAPI
 * Centralizados para mantener consistencia en toda la API
 */

export const swaggerSchemas = {
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
  Movement: {
    type: 'object',
    properties: {
      id: {
        type: 'number',
        description: 'ID único del movimiento',
      },
      movement_name: {
        type: 'string',
        description: 'Nombre del movimiento',
      },
      movement_val: {
        type: 'number',
        description: 'Valor del movimiento',
      },
      movement_date: {
        type: 'string',
        format: 'date',
        description: 'Fecha del movimiento',
      },
      movement_type: {
        type: 'number',
        description: 'Tipo de movimiento (1=ingreso, 2=egreso)',
      },
      movement_tag: {
        type: 'string',
        description: 'Etiqueta del movimiento',
      },
      currency: {
        type: 'string',
        description: 'Moneda del movimiento',
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
};
