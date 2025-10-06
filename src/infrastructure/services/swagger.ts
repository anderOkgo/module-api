import swaggerJsdoc from 'swagger-jsdoc';
import { userSwaggerDocumentation } from '../../modules/auth/infrastructure/documentation/user.swagger';
import { seriesSwaggerDocumentation } from '../../modules/series/infrastructure/documentation/series.swagger';
import { finanSwaggerDocumentation } from '../../modules/finan/infrastructure/documentation/finan.swagger';
import { swaggerSchemas } from './swagger.schemas';

/**
 * Main Swagger/OpenAPI configuration
 * Schemas are in swagger.schemas.ts
 * Routes are imported from documentation modules
 */
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Animecream API',
      version: '2.0.9',
      description: 'API for anime series management with CRUD functionality and optimized image handling',
      contact: {
        name: 'Anderokgo',
        email: 'support@animecream.com',
      },
    },
    servers: [
      {
        url: 'https://info.animecream.com',
        description: 'Production server',
      },
      {
        url: 'http://localhost:3001',
        description: 'Development server',
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
      schemas: swaggerSchemas,
    },
    paths: {
      ...convertToOpenAPIPaths(filterUserDocumentation(userSwaggerDocumentation)),
      ...convertToOpenAPIPaths(seriesSwaggerDocumentation),
      ...convertToOpenAPIPaths(finanSwaggerDocumentation),
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [],
};

/**
 * Filters user documentation based on environment
 */
function filterUserDocumentation(documentation: any) {
  // In production, hide registration endpoint
  if (process.env.NODE_ENV === 'production') {
    const filtered = { ...documentation };
    delete filtered.addUser; // Remove registration endpoint documentation
    return filtered;
  }
  return documentation;
}

/**
 * Converts module documentation to OpenAPI paths format
 */
function convertToOpenAPIPaths(documentation: any) {
  const paths: any = {};

  Object.keys(documentation).forEach((key) => {
    const endpointDoc = documentation[key];
    Object.keys(endpointDoc).forEach((path) => {
      if (!paths[path]) {
        paths[path] = {};
      }
      // Combine HTTP methods for the same route
      Object.assign(paths[path], endpointDoc[path]);
    });
  });

  return paths;
}

export const swaggerSpec = swaggerJsdoc(options);
export default swaggerSpec;
