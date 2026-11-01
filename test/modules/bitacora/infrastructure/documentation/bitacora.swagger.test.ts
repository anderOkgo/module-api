import { bitacoraSwaggerDocumentation } from '../../../../../src/modules/bitacora/infrastructure/documentation/bitacora.swagger';
import { swaggerSpec } from '../../../../../src/infrastructure/services/swagger';

describe('bitacoraSwaggerDocumentation', () => {
  const paths = Object.values(bitacoraSwaggerDocumentation).flatMap((doc) => Object.keys(doc));

  it('documents every endpoint of SPEC §3.2', () => {
    expect(paths.sort()).toEqual(
      [
        '/api/bitacora/entries',
        '/api/bitacora/entries/import',
        '/api/bitacora/entries/{date}',
        '/api/bitacora/entries/{date}/nearby',
        '/api/bitacora/home/{date}',
        '/api/bitacora/trash',
        '/api/bitacora/trash/{date}/restore',
      ].sort()
    );
    expect(Object.keys(bitacoraSwaggerDocumentation.entry['/api/bitacora/entries/{date}'])).toEqual([
      'get',
      'put',
      'delete',
    ]);
  });

  it('is merged into the global OpenAPI spec', () => {
    const spec = swaggerSpec as { paths: Record<string, unknown> };
    for (const path of paths) expect(spec.paths[path]).toBeDefined();
  });
});
