/**
 * Reusable Swagger/OpenAPI schemas
 * Centralized to maintain consistency throughout the API
 */

export const swaggerSchemas = {
  // ==================== SERIES SCHEMAS ====================/
  Series: {
    type: 'object',
    properties: {
      id: {
        type: 'number',
        description: 'Unique series ID',
        example: 1,
      },
      name: {
        type: 'string',
        description: 'Series name',
        example: 'One Piece',
      },
      chapter_numer: {
        type: 'number',
        description: 'Number of chapters',
        example: 1000,
      },
      year: {
        type: 'number',
        description: 'Production year',
        example: 1999,
      },
      description: {
        type: 'string',
        description: 'Series description',
        example: 'Las aventuras de Monkey D. Luffy...',
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
      demographic_name: {
        type: 'string',
        description: 'Demographic name',
        example: 'Shonen',
      },
      visible: {
        type: 'boolean',
        description: 'Whether the series is visible',
        example: true,
      },
      image: {
        type: 'string',
        description: 'Path to the optimized image',
        example: '/img/tarjeta/1.jpg',
      },
      rank: {
        type: 'number',
        description: 'Series ranking',
        example: 1,
      },
      created_at: {
        type: 'string',
        format: 'date-time',
        description: 'Creation date',
      },
      updated_at: {
        type: 'string',
        format: 'date-time',
        description: 'Last update date',
      },
    },
    required: ['name', 'chapter_numer', 'year', 'description', 'qualification', 'demography_id', 'visible'],
  },
  SeriesCreateRequest: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Series name',
        example: 'One Piece',
        minLength: 2,
        maxLength: 200,
      },
      chapter_number: {
        type: 'number',
        description: 'Number of chapters',
        example: 1000,
        minimum: 0,
      },
      year: {
        type: 'number',
        description: 'Production year',
        example: 1999,
        minimum: 1900,
      },
      description: {
        type: 'string',
        description: 'Series description',
        example: 'Las aventuras de Monkey D. Luffy...',
        maxLength: 5000,
      },
      qualification: {
        type: 'number',
        description: 'Rating from 0 to 10',
        example: 9.5,
        minimum: 0,
        maximum: 10,
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
    },
    required: ['name', 'chapter_number', 'year', 'description', 'qualification', 'demography_id', 'visible'],
  },
  SeriesUpdateRequest: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Series name',
        example: 'One Piece',
        minLength: 2,
        maxLength: 200,
      },
      chapter_number: {
        type: 'number',
        description: 'Number of chapters',
        example: 1000,
        minimum: 0,
      },
      year: {
        type: 'number',
        description: 'Production year',
        example: 1999,
        minimum: 1900,
      },
      description: {
        type: 'string',
        description: 'Series description',
        example: 'Las aventuras de Monkey D. Luffy...',
        maxLength: 5000,
      },
      qualification: {
        type: 'number',
        description: 'Rating from 0 to 10',
        example: 9.5,
        minimum: 0,
        maximum: 10,
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
    },
  },
  SeriesResponse: {
    type: 'object',
    properties: {
      id: {
        type: 'number',
        description: 'Unique series ID',
        example: 1,
      },
      name: {
        type: 'string',
        description: 'Series name',
        example: 'One Piece',
      },
      chapter_number: {
        type: 'number',
        description: 'Number of chapters',
        example: 1000,
      },
      year: {
        type: 'number',
        description: 'Production year',
        example: 1999,
      },
      description: {
        type: 'string',
        description: 'Series description',
        example: 'Las aventuras de Monkey D. Luffy...',
      },
      qualification: {
        type: 'number',
        description: 'Rating from 0 to 10',
        example: 9.5,
      },
      demography_id: {
        type: 'number',
        description: 'Demographic ID',
        example: 1,
      },
      demographic_name: {
        type: 'string',
        description: 'Demographic name',
        example: 'Shonen',
      },
      visible: {
        type: 'boolean',
        description: 'Whether the series is visible',
        example: true,
      },
      image: {
        type: 'string',
        description: 'Ruta de la imagen',
        example: '/img/tarjeta/1.jpg',
      },
      rank: {
        type: 'number',
        description: 'Series ranking',
        example: 1,
      },
      genres: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/Genre',
        },
        description: 'Associated genres',
      },
      titles: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/Title',
        },
        description: 'Alternative titles',
      },
    },
  },
  Genre: {
    type: 'object',
    properties: {
      id: {
        type: 'number',
        description: 'Genre ID',
        example: 1,
      },
      name: {
        type: 'string',
        description: 'Genre name',
        example: 'Acción',
      },
      slug: {
        type: 'string',
        description: 'Genre slug',
        example: 'accion',
      },
    },
  },
  Title: {
    type: 'object',
    properties: {
      id: {
        type: 'number',
        description: 'Alternative title ID',
        example: 1,
      },
      production_id: {
        type: 'number',
        description: 'Production ID',
        example: 1,
      },
      name: {
        type: 'string',
        description: 'Alternative title name',
        example: 'ワンピース',
      },
    },
  },
  Demographic: {
    type: 'object',
    properties: {
      id: {
        type: 'number',
        description: 'Demographic ID',
        example: 1,
      },
      name: {
        type: 'string',
        description: 'Demographic name',
        example: 'Shonen',
      },
      slug: {
        type: 'string',
        description: 'Demographic slug',
        example: 'shonen',
      },
    },
  },
  // ==================== FINANCE SCHEMAS ====================
  Movement: {
    type: 'object',
    properties: {
      id: {
        type: 'number',
        description: 'Unique movement ID',
        example: 1,
      },
      name: {
        type: 'string',
        description: 'Movement name',
        example: 'Compra de comida',
      },
      value: {
        type: 'number',
        description: 'Movement value',
        example: 50.75,
      },
      date_movement: {
        type: 'string',
        format: 'date',
        description: 'Movement date',
        example: '2025-10-02',
      },
      type_source_id: {
        type: 'number',
        description: 'Movement type (1=INCOME, 2=EXPENSE, 8=TRANSFER)',
        example: 2,
      },
      tag: {
        type: 'string',
        description: 'Movement tag',
        example: 'Alimentación',
      },
      currency: {
        type: 'string',
        description: 'Movement currency',
        example: 'USD',
      },
      user: {
        type: 'string',
        description: 'Owner user',
        example: 'anderokgo',
      },
      log: {
        type: 'number',
        description: 'Movement log',
        example: 0,
      },
    },
    required: ['name', 'value', 'date_movement', 'type_source_id', 'tag', 'currency', 'user'],
  },
  CreateMovementRequest: {
    type: 'object',
    properties: {
      movement_name: {
        type: 'string',
        description: 'Movement name',
        example: 'Compra de comida',
        minLength: 1,
        maxLength: 200,
      },
      movement_val: {
        type: 'number',
        description: 'Movement value',
        example: 50.75,
      },
      movement_date: {
        type: 'string',
        format: 'date',
        description: 'Movement date',
        example: '2025-10-02',
      },
      movement_type: {
        type: 'number',
        enum: [1, 2, 8],
        description: 'Movement type (1=INCOME, 2=EXPENSE, 8=TRANSFER)',
        example: 2,
      },
      movement_tag: {
        type: 'string',
        description: 'Movement tag',
        example: 'Alimentación',
      },
      currency: {
        type: 'string',
        description: 'Movement currency',
        example: 'USD',
      },
      username: {
        type: 'string',
        description: 'Owner user',
        example: 'anderokgo',
      },
      operate_for: {
        type: 'number',
        description: 'Linked movement ID (optional)',
        example: 5,
      },
    },
    required: [
      'movement_name',
      'movement_val',
      'movement_date',
      'movement_type',
      'movement_tag',
      'currency',
      'username',
    ],
  },
  UpdateMovementRequest: {
    type: 'object',
    properties: {
      movement_name: {
        type: 'string',
        description: 'Movement name',
        example: 'Compra de comida',
        minLength: 1,
        maxLength: 200,
      },
      movement_val: {
        type: 'number',
        description: 'Movement value',
        example: 50.75,
      },
      movement_date: {
        type: 'string',
        format: 'date',
        description: 'Movement date',
        example: '2025-10-02',
      },
      movement_type: {
        type: 'number',
        enum: [1, 2, 8],
        description: 'Movement type (1=INCOME, 2=EXPENSE, 8=TRANSFER)',
        example: 2,
      },
      movement_tag: {
        type: 'string',
        description: 'Movement tag',
        example: 'Alimentación',
      },
      currency: {
        type: 'string',
        description: 'Movement currency',
        example: 'USD',
      },
      operate_for: {
        type: 'number',
        description: 'Linked movement ID (optional)',
        example: 5,
      },
    },
    required: ['movement_name', 'movement_val', 'movement_date', 'movement_type', 'movement_tag', 'currency'],
  },
  MovementResponse: {
    type: 'object',
    properties: {
      id: {
        type: 'number',
        description: 'Unique movement ID',
        example: 1,
      },
      name: {
        type: 'string',
        description: 'Movement name',
        example: 'Compra de comida',
      },
      value: {
        type: 'number',
        description: 'Movement value',
        example: 50.75,
      },
      date_movement: {
        type: 'string',
        format: 'date',
        description: 'Movement date',
        example: '2025-10-02',
      },
      type_source_id: {
        type: 'number',
        description: 'Tipo de movimiento',
        example: 2,
      },
      tag: {
        type: 'string',
        description: 'Movement tag',
        example: 'Alimentación',
      },
      currency: {
        type: 'string',
        description: 'Movement currency',
        example: 'USD',
      },
      user: {
        type: 'string',
        description: 'Owner user',
        example: 'anderokgo',
      },
    },
  },
  Error: {
    type: 'object',
    properties: {
      error: {
        type: 'string',
        description: 'Error message',
      },
      details: {
        type: 'array',
        items: {
          type: 'string',
        },
        description: 'Error details',
      },
    },
  },
  SuccessResponse: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        description: 'Success message',
      },
      data: {
        type: 'object',
        description: 'Response data',
      },
    },
  },
  // ==================== AUTHENTICATION SCHEMAS ====================
  User: {
    type: 'object',
    properties: {
      id: {
        type: 'number',
        description: 'Unique user ID',
        example: 1,
      },
      first_name: {
        type: 'string',
        description: 'User first name',
        example: 'Juan',
      },
      last_name: {
        type: 'string',
        description: 'User last name',
        example: 'Pérez',
      },
      username: {
        type: 'string',
        description: 'Unique username',
        example: 'juanperez',
      },
      email: {
        type: 'string',
        format: 'email',
        description: 'User email',
        example: 'juan@example.com',
      },
      role: {
        type: 'number',
        enum: [1, 2, 3],
        description: 'User role (1=ADMIN, 2=USER, 3=GUEST)',
        example: 2,
      },
      active: {
        type: 'boolean',
        description: 'Whether the user is active',
        example: true,
      },
      created: {
        type: 'string',
        format: 'date-time',
        description: 'Creation date',
      },
      last_login: {
        type: 'string',
        format: 'date-time',
        description: 'Last login date',
      },
      login_attempts: {
        type: 'number',
        description: 'Number of failed login attempts',
        example: 0,
      },
      locked_until: {
        type: 'string',
        format: 'date-time',
        description: 'Date until the account is locked',
      },
    },
    required: ['first_name', 'last_name', 'username', 'email', 'role', 'password', 'active'],
  },
  UserCreateRequest: {
    type: 'object',
    properties: {
      first_name: {
        type: 'string',
        description: 'User first name',
        example: 'Juan',
        minLength: 2,
        maxLength: 50,
      },
      last_name: {
        type: 'string',
        description: 'User last name',
        example: 'Pérez',
        minLength: 2,
        maxLength: 50,
      },
      username: {
        type: 'string',
        description: 'Unique username',
        example: 'juanperez',
        minLength: 3,
        maxLength: 30,
      },
      email: {
        type: 'string',
        format: 'email',
        description: 'User email',
        example: 'juan@example.com',
      },
      password: {
        type: 'string',
        description: 'User password',
        example: 'password123',
        minLength: 6,
      },
      verificationCode: {
        type: 'number',
        description: 'Verification code (optional)',
        example: 123456,
      },
    },
    required: ['first_name', 'last_name', 'username', 'email', 'password'],
  },
  UserResponse: {
    type: 'object',
    properties: {
      id: {
        type: 'number',
        description: 'Unique user ID',
        example: 1,
      },
      first_name: {
        type: 'string',
        description: 'User first name',
        example: 'Juan',
      },
      last_name: {
        type: 'string',
        description: 'User last name',
        example: 'Pérez',
      },
      username: {
        type: 'string',
        description: 'Nombre de usuario',
        example: 'juanperez',
      },
      email: {
        type: 'string',
        format: 'email',
        description: 'Correo electrónico',
        example: 'juan@example.com',
      },
      role: {
        type: 'number',
        enum: [1, 2, 3],
        description: 'User role (1=ADMIN, 2=USER, 3=GUEST)',
        example: 2,
      },
      active: {
        type: 'boolean',
        description: 'Whether the user is active',
        example: true,
      },
      created: {
        type: 'string',
        format: 'date-time',
        description: 'Creation date',
      },
      last_login: {
        type: 'string',
        format: 'date-time',
        description: 'Last login date',
      },
    },
  },
  LoginRequest: {
    type: 'object',
    properties: {
      username: {
        type: 'string',
        description: 'Username or email',
        example: 'juanperez',
      },
      password: {
        type: 'string',
        description: 'User password',
        example: 'password123',
      },
    },
    required: ['username', 'password'],
  },
  LoginResponse: {
    type: 'object',
    properties: {
      user: {
        $ref: '#/components/schemas/UserResponse',
      },
      token: {
        type: 'string',
        description: 'JWT authentication token',
        example:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoianVhbnBlcmV6IiwiaWF0IjoxNjE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
      },
      expiresIn: {
        type: 'number',
        description: 'Token expiration time in seconds',
        example: 86400,
      },
    },
  },
};
