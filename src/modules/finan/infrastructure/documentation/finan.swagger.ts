/**
 * COMPLETE Swagger documentation for the financial module
 * Separated from controller to maintain clean code
 */

export const finanSwaggerDocumentation = {
  // 1. POST /api/finan/initial-load - Get initial load
  getInitialLoad: {
    '/api/finan/initial-load': {
      post: {
        summary: 'Get initial load of financial data',
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
                    description: 'Currency code (3 characters)',
                    example: 'AUD',
                    minLength: 3,
                    maxLength: 3,
                  },
                  start_date: {
                    type: 'string',
                    format: 'date',
                    description: 'Start date to filter data (optional)',
                    example: '2024-01-01',
                  },
                  end_date: {
                    type: 'string',
                    format: 'date',
                    description: 'End date to filter data (optional)',
                    example: '2024-12-31',
                  },
                  username: {
                    type: 'string',
                    description: 'Username (optional)',
                    example: 'androgko',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Financial data retrieved successfully',
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
                      example: 'Financial data retrieved successfully',
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
            description: 'Error in parameter validation',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          401: {
            description: 'Invalid or missing authorization token',
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

  // 2. POST /api/finan/insert - Create movement
  putMovement: {
    '/api/finan/insert': {
      post: {
        summary: 'Create new financial movement',
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
                    description: 'Movement name',
                    example: 'Compra de comida',
                  },
                  movement_val: {
                    type: 'number',
                    description: 'Movement value',
                    example: 25.5,
                  },
                  movement_date: {
                    type: 'string',
                    format: 'date',
                    description: 'Movement date',
                    example: '2024-01-15',
                  },
                  movement_type: {
                    type: 'number',
                    description: 'Movement type (1=income, 2=expense)',
                    example: 1,
                  },
                  movement_tag: {
                    type: 'string',
                    description: 'Movement tag',
                    example: 'food',
                  },
                  currency: {
                    type: 'string',
                    description: 'Currency',
                    example: 'USD',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Movement created successfully',
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
                      example: 'Movement created successfully',
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
            description: 'Error in data validation',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          401: {
            description: 'Invalid or missing authorization token',
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

  // 3. PUT /api/finan/update/{id} - Update movement
  updateMovement: {
    '/api/finan/update/{id}': {
      put: {
        summary: 'Update financial movement',
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
            description: 'Movement ID',
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
                    description: 'Movement name',
                    example: 'Compra de comida actualizada',
                  },
                  movement_val: {
                    type: 'number',
                    description: 'Movement value',
                    example: 30.0,
                  },
                  movement_date: {
                    type: 'string',
                    format: 'date',
                    description: 'Movement date',
                    example: '2024-01-15',
                  },
                  movement_type: {
                    type: 'number',
                    description: 'Movement type (1=income, 2=expense)',
                    example: 1,
                  },
                  movement_tag: {
                    type: 'string',
                    description: 'Movement tag',
                    example: 'food',
                  },
                  currency: {
                    type: 'string',
                    description: 'Currency',
                    example: 'USD',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Movement updated successfully',
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
                      example: 'Movement updated successfully',
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
            description: 'Error in data validation',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          401: {
            description: 'Invalid or missing authorization token',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          404: {
            description: 'Movement not found',
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

  // 4. DELETE /api/finan/delete/{id} - Delete movement
  deleteMovement: {
    '/api/finan/delete/{id}': {
      delete: {
        summary: 'Delete financial movement',
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
            description: 'Movement ID',
            schema: {
              type: 'integer',
            },
          },
        ],
        responses: {
          200: {
            description: 'Movement deleted successfully',
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
                      example: 'Movement deleted successfully',
                    },
                  },
                },
              },
            },
          },
          401: {
            description: 'Invalid or missing authorization token',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          404: {
            description: 'Movement not found',
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
};
