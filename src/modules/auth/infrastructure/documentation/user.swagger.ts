/**
 * Swagger documentation for the authentication module
 * Separated from controller to maintain clean code
 */

/** Auth SPEC v0.6: an IP with 20 failed passwords or codes in 15 minutes is refused before any check. */
const ipLimitResponse = (extra = '') => ({
  description: `"Too many attempts, try again later": this IP failed 20 times in 15 minutes${extra}`,
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
});

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
          429: ipLimitResponse(
            ' (only with verificationCode); or, without one, "Too many requests, try again in a minute" when a code was sent less than a minute ago'
          ),
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
          429: ipLimitResponse(),
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

  // Auth SPEC v0.5, C4: the answer never tells whether an account uses the email (D6)
  requestPasswordReset: {
    '/api/users/password-reset/request': {
      post: {
        summary: 'Ask for a password reset code by email',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: { email: { type: 'string', example: 'user@example.com' } },
              },
            },
          },
        },
        responses: {
          200: {
            description:
              'Always the same answer. A code (valid 15 minutes) is emailed only when an account uses the email, at most once a minute',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'If an account uses this email, a code was sent' },
                  },
                },
              },
            },
          },
          400: {
            description: 'Invalid email format',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          500: {
            description: 'Internal server error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
  },

  // Auth SPEC v0.5, C5: also clears the login lock; other sessions stay open (D7)
  confirmPasswordReset: {
    '/api/users/password-reset/confirm': {
      post: {
        summary: 'Set a new password with the emailed code',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'code', 'newPassword'],
                properties: {
                  email: { type: 'string', example: 'user@example.com' },
                  code: { type: 'integer', example: 123456 },
                  newPassword: { type: 'string', minLength: 6, example: 'newSecret123' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Password changed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'Password changed' },
                  },
                },
              },
            },
          },
          400: {
            description:
              '"Invalid or expired code" (wrong, older than 15 minutes, used up after 5 wrong tries, or unknown email), or a password under 6 characters',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          429: ipLimitResponse(),
          500: {
            description: 'Internal server error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
  },
};
