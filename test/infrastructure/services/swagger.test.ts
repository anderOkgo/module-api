// swagger.ts builds its OpenAPI spec eagerly at module-load time (not
// per-request), including an environment-dependent filter that hides the
// registration endpoint's docs in production. To exercise both branches, the
// module has to be freshly required under each NODE_ENV value.
describe('swagger.ts', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    jest.resetModules();
  });

  it('includes the registration endpoint docs outside production', () => {
    process.env.NODE_ENV = 'development';
    jest.resetModules();

    const { swaggerSpec } = require('../../../src/infrastructure/services/swagger');

    expect(swaggerSpec.paths['/api/users/add']).toBeDefined();
  });

  it('hides the registration endpoint docs in production', () => {
    process.env.NODE_ENV = 'production';
    jest.resetModules();

    const { swaggerSpec } = require('../../../src/infrastructure/services/swagger');

    expect(swaggerSpec.paths['/api/users/add']).toBeUndefined();
  });
});
