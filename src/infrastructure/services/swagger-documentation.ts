/**
 * Centralized Swagger documentation registry
 * Imports and registers all module documentation
 */

import { userSwaggerDocumentation } from '../../modules/auth/infrastructure/documentation/user.swagger';
import { seriesSwaggerDocumentation } from '../../modules/series/infrastructure/documentation/series.swagger';
import { finanSwaggerDocumentation } from '../../modules/finan/infrastructure/documentation/finan.swagger';

/**
 * Consolidated Swagger documentation from all modules
 */
export const consolidatedSwaggerDocumentation = {
  ...userSwaggerDocumentation,
  ...seriesSwaggerDocumentation,
  ...finanSwaggerDocumentation,
};

/**
 * Function to register Swagger documentation on the server
 * @param swaggerInstance - Swagger instance
 */
export function registerSwaggerDocumentation(swaggerInstance: any) {
  // Register authentication documentation
  Object.assign(swaggerInstance, userSwaggerDocumentation);

  // Register series documentation
  Object.assign(swaggerInstance, seriesSwaggerDocumentation);

  // Register financial documentation
  Object.assign(swaggerInstance, finanSwaggerDocumentation);

  console.log('✅ Swagger documentation registered successfully');
}
