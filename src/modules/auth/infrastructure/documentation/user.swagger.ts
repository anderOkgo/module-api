/**
 * Swagger documentation for the authentication module
 * Separated from controller to maintain clean code
 */

export const userSwaggerDocumentation = {
  addUser: {
    '/api/users/add': {
      post: {
        summary: 'Register new user',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UserCreateRequest',
              },
            },
          },
        },
        responses: {
          201: {
            description: 'User registered successfully',
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
                      example: 'User registered successfully',
                    },
                    data: {
                      $ref: '#/components/schemas/UserResponse',
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'Validation error or user already exists',
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

  loginUser: {
    '/api/users/login': {
      post: {
        summary: 'User login',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/LoginRequest',
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Successful login',
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
                      example: 'Successful login',
                    },
                    data: {
                      $ref: '#/components/schemas/LoginResponse',
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'Invalid credentials',
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

  adminResetPassword: {
    '/api/users/admin/reset-password': {
      put: {
        summary: "Admin resets another user's password (no current password required)",
        tags: ['Authentication'],
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
                required: ['identifier', 'newPassword'],
                properties: {
                  identifier: {
                    type: 'string',
                    description: 'Username or email of the target user',
                    example: 'someuser',
                  },
                  newPassword: {
                    type: 'string',
                    description: 'New password (minimum 6 characters)',
                    example: 'newSecurePassword123',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Password reset successfully',
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
                      example: 'Password reset successfully',
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'Validation error or user not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          401: {
            description: 'Missing or invalid token',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          403: {
            description: 'Forbidden - admin role required',
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
