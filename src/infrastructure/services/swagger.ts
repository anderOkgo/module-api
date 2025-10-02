import swaggerJsdoc from 'swagger-jsdoc';
import { userSwaggerDocumentation } from '../../modules/auth/infrastructure/documentation/user.swagger';
import { seriesSwaggerDocumentation } from '../../modules/series/infrastructure/documentation/series.swagger';
import { finanSwaggerDocumentation } from '../../modules/finan/infrastructure/documentation/finan.swagger';
import { swaggerSchemas } from './swagger.schemas';

/**
 * Configuración principal de Swagger/OpenAPI
 * Los schemas están en swagger.schemas.ts
 * Las rutas se importan desde los módulos de documentación
 */
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
        url: 'https://info.animecream.com',
        description: 'Servidor de producción',
      },
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
      schemas: swaggerSchemas,
    },
    paths: {
      ...convertToOpenAPIPaths(userSwaggerDocumentation),
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
 * Convierte la documentación de módulos al formato OpenAPI paths
 */
function convertToOpenAPIPaths(documentation: any) {
  const paths: any = {};

  Object.keys(documentation).forEach((key) => {
    const endpointDoc = documentation[key];
    Object.keys(endpointDoc).forEach((path) => {
      paths[path] = endpointDoc[path];
    });
  });

  return paths;
}

export const swaggerSpec = swaggerJsdoc(options);
export default swaggerSpec;
