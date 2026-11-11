import { bitacoraSwaggerDocumentation } from '../../../../../src/modules/bitacora/infrastructure/documentation/bitacora.swagger';
import { swaggerSpec } from '../../../../../src/infrastructure/services/swagger';

type Operation = { parameters?: Array<{ name: string; in: string }>; responses: Record<string, unknown> };

describe('bitacoraSwaggerDocumentation', () => {
  const docs = bitacoraSwaggerDocumentation as unknown as Record<string, Record<string, Record<string, Operation>>>;
  const paths = Object.values(docs).flatMap((doc) => Object.keys(doc));

  it('documents every endpoint of SPEC §3.2 and §3.5', () => {
    expect(paths.sort()).toEqual(
      [
        '/api/bitacora/entries',
        '/api/bitacora/entries/import',
        '/api/bitacora/entries/{date}',
        '/api/bitacora/entries/{date}/nearby',
        '/api/bitacora/home/{date}',
        '/api/bitacora/trash',
        '/api/bitacora/trash/{date}/restore',
        '/api/bitacora/search',
        '/api/bitacora/key',
      ].sort()
    );
    expect(Object.keys(bitacoraSwaggerDocumentation.entry['/api/bitacora/entries/{date}'])).toEqual([
      'get',
      'put',
      'delete',
    ]);
    expect(Object.keys(bitacoraSwaggerDocumentation.key['/api/bitacora/key'])).toEqual(['get', 'post', 'put']);
  });

  it('every diary operation takes the key header and documents 403 and 428 (SPEC v1.11 §3.5)', () => {
    for (const [name, doc] of Object.entries(docs)) {
      if (name === 'key') continue;
      for (const operation of Object.values(doc).flatMap((ops) => Object.values(ops))) {
        expect(operation.parameters).toContainEqual(expect.objectContaining({ name: 'X-Bitacora-Key', in: 'header' }));
        expect(Object.keys(operation.responses)).toEqual(expect.arrayContaining(['403', '428']));
      }
    }
  });

  it('GET /key needs no key header; POST and PUT do', () => {
    const key = docs.key['/api/bitacora/key'];
    expect(key.get.parameters).toBeUndefined();
    expect(key.post.parameters?.map((p) => p.name)).toEqual(['X-Bitacora-Key']);
    expect(key.put.parameters?.map((p) => p.name)).toEqual(['X-Bitacora-Key', 'X-Bitacora-New-Key']);
  });

  it('is merged into the global OpenAPI spec', () => {
    const spec = swaggerSpec as { paths: Record<string, unknown> };
    for (const path of paths) expect(spec.paths[path]).toBeDefined();
  });
});
