/**
 * Documentación Swagger COMPLETA para el módulo financiero
 * Separada del controlador para mantener código limpio
 */

export const finanSwaggerDocumentation = {
  // 1. POST /api/finan/initial-load - Obtener carga inicial
  getInitialLoad: {
    '/api/finan/initial-load': {
      post: {
        summary: 'Obtener carga inicial de datos financieros',
        tags: ['Finance'],
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
                required: ['currency'],
                properties: {
                  currency: {
                    type: 'string',
                    description: 'Código de moneda (3 caracteres)',
                    example: 'AUD',
                    minLength: 3,
                    maxLength: 3,
                  },
                  start_date: {
                    type: 'string',
                    format: 'date',
                    description: 'Fecha de inicio para filtrar datos (opcional)',
                    example: '2024-01-01',
                  },
                  end_date: {
                    type: 'string',
                    format: 'date',
                    description: 'Fecha de fin para filtrar datos (opcional)',
                    example: '2024-12-31',
                  },
                  username: {
                    type: 'string',
                    description: 'Nombre de usuario (opcional)',
                    example: 'androgko',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Datos financieros obtenidos exitosamente',
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
                      example: 'Datos financieros obtenidos exitosamente',
                    },
                    data: {
                      type: 'object',
                      properties: {
                        movements: {
                          type: 'array',
                          items: {
                            $ref: '#/components/schemas/Movement',
                          },
                        },
                        totalIncome: {
                          type: 'number',
                          example: 5000.0,
                        },
                        totalExpenses: {
                          type: 'number',
                          example: 3000.0,
                        },
                        balance: {
                          type: 'number',
                          example: 2000.0,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'Error en la validación de parámetros',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          401: {
            description: 'Token de autorización inválido o faltante',
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

  // 2. POST /api/finan/insert - Crear movimiento
  putMovement: {
    '/api/finan/insert': {
      post: {
        summary: 'Crear nuevo movimiento financiero',
        tags: ['Finance'],
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
                  'movement_name',
                  'movement_val',
                  'movement_date',
                  'movement_type',
                  'movement_tag',
                  'currency',
                ],
                properties: {
                  movement_name: {
                    type: 'string',
                    description: 'Nombre del movimiento',
                    example: 'Compra de comida',
                  },
                  movement_val: {
                    type: 'number',
                    description: 'Valor del movimiento',
                    example: 25.5,
                  },
                  movement_date: {
                    type: 'string',
                    format: 'date',
                    description: 'Fecha del movimiento',
                    example: '2024-01-15',
                  },
                  movement_type: {
                    type: 'number',
                    description: 'Tipo de movimiento (1=ingreso, 2=egreso)',
                    example: 1,
                  },
                  movement_tag: {
                    type: 'string',
                    description: 'Etiqueta del movimiento',
                    example: 'food',
                  },
                  currency: {
                    type: 'string',
                    description: 'Moneda',
                    example: 'USD',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Movimiento creado exitosamente',
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
                      example: 'Movimiento creado exitosamente',
                    },
                    data: {
                      $ref: '#/components/schemas/Movement',
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'Error en la validación de datos',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          401: {
            description: 'Token de autorización inválido o faltante',
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

  // 3. PUT /api/finan/update/{id} - Actualizar movimiento
  updateMovement: {
    '/api/finan/update/{id}': {
      put: {
        summary: 'Actualizar movimiento financiero',
        tags: ['Finance'],
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID del movimiento',
            schema: {
              type: 'integer',
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  movement_name: {
                    type: 'string',
                    description: 'Nombre del movimiento',
                    example: 'Compra de comida actualizada',
                  },
                  movement_val: {
                    type: 'number',
                    description: 'Valor del movimiento',
                    example: 30.0,
                  },
                  movement_date: {
                    type: 'string',
                    format: 'date',
                    description: 'Fecha del movimiento',
                    example: '2024-01-15',
                  },
                  movement_type: {
                    type: 'number',
                    description: 'Tipo de movimiento (1=ingreso, 2=egreso)',
                    example: 1,
                  },
                  movement_tag: {
                    type: 'string',
                    description: 'Etiqueta del movimiento',
                    example: 'food',
                  },
                  currency: {
                    type: 'string',
                    description: 'Moneda',
                    example: 'USD',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Movimiento actualizado exitosamente',
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
                      example: 'Movimiento actualizado exitosamente',
                    },
                    data: {
                      $ref: '#/components/schemas/Movement',
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'Error en la validación de datos',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          401: {
            description: 'Token de autorización inválido o faltante',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          404: {
            description: 'Movimiento no encontrado',
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

  // 4. DELETE /api/finan/delete/{id} - Eliminar movimiento
  deleteMovement: {
    '/api/finan/delete/{id}': {
      delete: {
        summary: 'Eliminar movimiento financiero',
        tags: ['Finance'],
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID del movimiento',
            schema: {
              type: 'integer',
            },
          },
        ],
        responses: {
          200: {
            description: 'Movimiento eliminado exitosamente',
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
                      example: 'Movimiento eliminado exitosamente',
                    },
                  },
                },
              },
            },
          },
          401: {
            description: 'Token de autorización inválido o faltante',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          404: {
            description: 'Movimiento no encontrado',
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
};
