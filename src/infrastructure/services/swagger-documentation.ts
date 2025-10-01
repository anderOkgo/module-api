/**
 * Registro centralizado de documentación Swagger
 * Importa y registra toda la documentación de los módulos
 */

import { userSwaggerDocumentation } from '../../modules/auth/infrastructure/documentation/user.swagger';
import { seriesSwaggerDocumentation } from '../../modules/series/infrastructure/documentation/series.swagger';
import { finanSwaggerDocumentation } from '../../modules/finan/infrastructure/documentation/finan.swagger';

/**
 * Documentación Swagger consolidada de todos los módulos
 */
export const consolidatedSwaggerDocumentation = {
  ...userSwaggerDocumentation,
  ...seriesSwaggerDocumentation,
  ...finanSwaggerDocumentation,
};

/**
 * Función para registrar documentación Swagger en el servidor
 * @param swaggerInstance - Instancia de Swagger
 */
export function registerSwaggerDocumentation(swaggerInstance: any) {
  // Registrar documentación de autenticación
  Object.assign(swaggerInstance, userSwaggerDocumentation);

  // Registrar documentación de series
  Object.assign(swaggerInstance, seriesSwaggerDocumentation);

  // Registrar documentación financiera
  Object.assign(swaggerInstance, finanSwaggerDocumentation);

  console.log('✅ Documentación Swagger registrada exitosamente');
}
