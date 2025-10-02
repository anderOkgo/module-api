/**
 * Schemas reutilizables de Swagger/OpenAPI
 * Centralizados para mantener consistencia en toda la API
 */

export const swaggerSchemas = {
  // ==================== ESQUEMAS DE SERIES ====================
  Series: {
    type: 'object',
    properties: {
      id: {
        type: 'number',
        description: 'ID único de la serie',
        example: 1,
      },
      name: {
        type: 'string',
        description: 'Nombre de la serie',
        example: 'One Piece',
      },
      chapter_numer: {
        type: 'number',
        description: 'Número de capítulos',
        example: 1000,
      },
      year: {
        type: 'number',
        description: 'Año de producción',
        example: 1999,
      },
      description: {
        type: 'string',
        description: 'Descripción de la serie',
        example: 'Las aventuras de Monkey D. Luffy...',
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
      demographic_name: {
        type: 'string',
        description: 'Nombre de la demografía',
        example: 'Shonen',
      },
      visible: {
        type: 'boolean',
        description: 'Si la serie es visible',
        example: true,
      },
      image: {
        type: 'string',
        description: 'Ruta de la imagen optimizada',
        example: '/img/tarjeta/1.jpg',
      },
      rank: {
        type: 'number',
        description: 'Ranking de la serie',
        example: 1,
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
    required: ['name', 'chapter_numer', 'year', 'description', 'qualification', 'demography_id', 'visible'],
  },
  SeriesCreateRequest: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Nombre de la serie',
        example: 'One Piece',
        minLength: 2,
        maxLength: 200,
      },
      chapter_number: {
        type: 'number',
        description: 'Número de capítulos',
        example: 1000,
        minimum: 0,
      },
      year: {
        type: 'number',
        description: 'Año de producción',
        example: 1999,
        minimum: 1900,
      },
      description: {
        type: 'string',
        description: 'Descripción de la serie',
        example: 'Las aventuras de Monkey D. Luffy...',
        maxLength: 5000,
      },
      qualification: {
        type: 'number',
        description: 'Calificación de 0 a 10',
        example: 9.5,
        minimum: 0,
        maximum: 10,
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
    },
    required: ['name', 'chapter_number', 'year', 'description', 'qualification', 'demography_id', 'visible'],
  },
  SeriesUpdateRequest: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Nombre de la serie',
        example: 'One Piece',
        minLength: 2,
        maxLength: 200,
      },
      chapter_number: {
        type: 'number',
        description: 'Número de capítulos',
        example: 1000,
        minimum: 0,
      },
      year: {
        type: 'number',
        description: 'Año de producción',
        example: 1999,
        minimum: 1900,
      },
      description: {
        type: 'string',
        description: 'Descripción de la serie',
        example: 'Las aventuras de Monkey D. Luffy...',
        maxLength: 5000,
      },
      qualification: {
        type: 'number',
        description: 'Calificación de 0 a 10',
        example: 9.5,
        minimum: 0,
        maximum: 10,
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
    },
  },
  SeriesResponse: {
    type: 'object',
    properties: {
      id: {
        type: 'number',
        description: 'ID único de la serie',
        example: 1,
      },
      name: {
        type: 'string',
        description: 'Nombre de la serie',
        example: 'One Piece',
      },
      chapter_number: {
        type: 'number',
        description: 'Número de capítulos',
        example: 1000,
      },
      year: {
        type: 'number',
        description: 'Año de producción',
        example: 1999,
      },
      description: {
        type: 'string',
        description: 'Descripción de la serie',
        example: 'Las aventuras de Monkey D. Luffy...',
      },
      qualification: {
        type: 'number',
        description: 'Calificación de 0 a 10',
        example: 9.5,
      },
      demography_id: {
        type: 'number',
        description: 'ID de la demografía',
        example: 1,
      },
      demographic_name: {
        type: 'string',
        description: 'Nombre de la demografía',
        example: 'Shonen',
      },
      visible: {
        type: 'boolean',
        description: 'Si la serie es visible',
        example: true,
      },
      image: {
        type: 'string',
        description: 'Ruta de la imagen',
        example: '/img/tarjeta/1.jpg',
      },
      rank: {
        type: 'number',
        description: 'Ranking de la serie',
        example: 1,
      },
      genres: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/Genre',
        },
        description: 'Géneros asociados',
      },
      titles: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/Title',
        },
        description: 'Títulos alternativos',
      },
    },
  },
  Genre: {
    type: 'object',
    properties: {
      id: {
        type: 'number',
        description: 'ID del género',
        example: 1,
      },
      name: {
        type: 'string',
        description: 'Nombre del género',
        example: 'Acción',
      },
      slug: {
        type: 'string',
        description: 'Slug del género',
        example: 'accion',
      },
    },
  },
  Title: {
    type: 'object',
    properties: {
      id: {
        type: 'number',
        description: 'ID del título alternativo',
        example: 1,
      },
      production_id: {
        type: 'number',
        description: 'ID de la producción',
        example: 1,
      },
      name: {
        type: 'string',
        description: 'Nombre del título alternativo',
        example: 'ワンピース',
      },
    },
  },
  Demographic: {
    type: 'object',
    properties: {
      id: {
        type: 'number',
        description: 'ID de la demografía',
        example: 1,
      },
      name: {
        type: 'string',
        description: 'Nombre de la demografía',
        example: 'Shonen',
      },
      slug: {
        type: 'string',
        description: 'Slug de la demografía',
        example: 'shonen',
      },
    },
  },
  // ==================== ESQUEMAS DE FINANZAS ====================
  Movement: {
    type: 'object',
    properties: {
      id: {
        type: 'number',
        description: 'ID único del movimiento',
        example: 1,
      },
      name: {
        type: 'string',
        description: 'Nombre del movimiento',
        example: 'Compra de comida',
      },
      value: {
        type: 'number',
        description: 'Valor del movimiento',
        example: 50.75,
      },
      date_movement: {
        type: 'string',
        format: 'date',
        description: 'Fecha del movimiento',
        example: '2025-10-02',
      },
      type_source_id: {
        type: 'number',
        description: 'Tipo de movimiento (1=INCOME, 2=EXPENSE, 8=TRANSFER)',
        example: 2,
      },
      tag: {
        type: 'string',
        description: 'Etiqueta del movimiento',
        example: 'Alimentación',
      },
      currency: {
        type: 'string',
        description: 'Moneda del movimiento',
        example: 'USD',
      },
      user: {
        type: 'string',
        description: 'Usuario propietario',
        example: 'anderokgo',
      },
      log: {
        type: 'number',
        description: 'Log del movimiento',
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
        description: 'Nombre del movimiento',
        example: 'Compra de comida',
        minLength: 1,
        maxLength: 200,
      },
      movement_val: {
        type: 'number',
        description: 'Valor del movimiento',
        example: 50.75,
      },
      movement_date: {
        type: 'string',
        format: 'date',
        description: 'Fecha del movimiento',
        example: '2025-10-02',
      },
      movement_type: {
        type: 'number',
        enum: [1, 2, 8],
        description: 'Tipo de movimiento (1=INCOME, 2=EXPENSE, 8=TRANSFER)',
        example: 2,
      },
      movement_tag: {
        type: 'string',
        description: 'Etiqueta del movimiento',
        example: 'Alimentación',
      },
      currency: {
        type: 'string',
        description: 'Moneda del movimiento',
        example: 'USD',
      },
      username: {
        type: 'string',
        description: 'Usuario propietario',
        example: 'anderokgo',
      },
      operate_for: {
        type: 'number',
        description: 'ID del movimiento vinculado (opcional)',
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
        description: 'Nombre del movimiento',
        example: 'Compra de comida',
        minLength: 1,
        maxLength: 200,
      },
      movement_val: {
        type: 'number',
        description: 'Valor del movimiento',
        example: 50.75,
      },
      movement_date: {
        type: 'string',
        format: 'date',
        description: 'Fecha del movimiento',
        example: '2025-10-02',
      },
      movement_type: {
        type: 'number',
        enum: [1, 2, 8],
        description: 'Tipo de movimiento (1=INCOME, 2=EXPENSE, 8=TRANSFER)',
        example: 2,
      },
      movement_tag: {
        type: 'string',
        description: 'Etiqueta del movimiento',
        example: 'Alimentación',
      },
      currency: {
        type: 'string',
        description: 'Moneda del movimiento',
        example: 'USD',
      },
      operate_for: {
        type: 'number',
        description: 'ID del movimiento vinculado (opcional)',
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
        description: 'ID único del movimiento',
        example: 1,
      },
      name: {
        type: 'string',
        description: 'Nombre del movimiento',
        example: 'Compra de comida',
      },
      value: {
        type: 'number',
        description: 'Valor del movimiento',
        example: 50.75,
      },
      date_movement: {
        type: 'string',
        format: 'date',
        description: 'Fecha del movimiento',
        example: '2025-10-02',
      },
      type_source_id: {
        type: 'number',
        description: 'Tipo de movimiento',
        example: 2,
      },
      tag: {
        type: 'string',
        description: 'Etiqueta del movimiento',
        example: 'Alimentación',
      },
      currency: {
        type: 'string',
        description: 'Moneda del movimiento',
        example: 'USD',
      },
      user: {
        type: 'string',
        description: 'Usuario propietario',
        example: 'anderokgo',
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
  // ==================== ESQUEMAS DE AUTENTICACIÓN ====================
  User: {
    type: 'object',
    properties: {
      id: {
        type: 'number',
        description: 'ID único del usuario',
        example: 1,
      },
      first_name: {
        type: 'string',
        description: 'Nombre del usuario',
        example: 'Juan',
      },
      last_name: {
        type: 'string',
        description: 'Apellido del usuario',
        example: 'Pérez',
      },
      username: {
        type: 'string',
        description: 'Nombre de usuario único',
        example: 'juanperez',
      },
      email: {
        type: 'string',
        format: 'email',
        description: 'Correo electrónico del usuario',
        example: 'juan@example.com',
      },
      role: {
        type: 'number',
        enum: [1, 2, 3],
        description: 'Rol del usuario (1=ADMIN, 2=USER, 3=GUEST)',
        example: 2,
      },
      active: {
        type: 'boolean',
        description: 'Si el usuario está activo',
        example: true,
      },
      created: {
        type: 'string',
        format: 'date-time',
        description: 'Fecha de creación',
      },
      last_login: {
        type: 'string',
        format: 'date-time',
        description: 'Fecha del último login',
      },
      login_attempts: {
        type: 'number',
        description: 'Número de intentos de login fallidos',
        example: 0,
      },
      locked_until: {
        type: 'string',
        format: 'date-time',
        description: 'Fecha hasta cuando la cuenta está bloqueada',
      },
    },
    required: ['first_name', 'last_name', 'username', 'email', 'role', 'password', 'active'],
  },
  UserCreateRequest: {
    type: 'object',
    properties: {
      first_name: {
        type: 'string',
        description: 'Nombre del usuario',
        example: 'Juan',
        minLength: 2,
        maxLength: 50,
      },
      last_name: {
        type: 'string',
        description: 'Apellido del usuario',
        example: 'Pérez',
        minLength: 2,
        maxLength: 50,
      },
      username: {
        type: 'string',
        description: 'Nombre de usuario único',
        example: 'juanperez',
        minLength: 3,
        maxLength: 30,
      },
      email: {
        type: 'string',
        format: 'email',
        description: 'Correo electrónico del usuario',
        example: 'juan@example.com',
      },
      password: {
        type: 'string',
        description: 'Contraseña del usuario',
        example: 'password123',
        minLength: 6,
      },
      verificationCode: {
        type: 'number',
        description: 'Código de verificación (opcional)',
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
        description: 'ID único del usuario',
        example: 1,
      },
      first_name: {
        type: 'string',
        description: 'Nombre del usuario',
        example: 'Juan',
      },
      last_name: {
        type: 'string',
        description: 'Apellido del usuario',
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
        description: 'Rol del usuario (1=ADMIN, 2=USER, 3=GUEST)',
        example: 2,
      },
      active: {
        type: 'boolean',
        description: 'Si el usuario está activo',
        example: true,
      },
      created: {
        type: 'string',
        format: 'date-time',
        description: 'Fecha de creación',
      },
      last_login: {
        type: 'string',
        format: 'date-time',
        description: 'Fecha del último login',
      },
    },
  },
  LoginRequest: {
    type: 'object',
    properties: {
      username: {
        type: 'string',
        description: 'Nombre de usuario o email',
        example: 'juanperez',
      },
      password: {
        type: 'string',
        description: 'Contraseña del usuario',
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
        description: 'JWT token de autenticación',
        example:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoianVhbnBlcmV6IiwiaWF0IjoxNjE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
      },
      expiresIn: {
        type: 'number',
        description: 'Tiempo de expiración del token en segundos',
        example: 86400,
      },
    },
  },
};
