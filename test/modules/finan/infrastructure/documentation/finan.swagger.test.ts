import { finanSwaggerDocumentation } from '../../../../../src/modules/finan/infrastructure/documentation/finan.swagger';

describe('finanSwaggerDocumentation', () => {
  describe('Swagger Documentation', () => {
    it('should be defined', () => {
      expect(finanSwaggerDocumentation).toBeDefined();
    });

    it('should export swagger configuration', () => {
      expect(typeof finanSwaggerDocumentation).toBe('object');
    });

    it('should have required endpoint properties', () => {
      // Check if the swagger has the expected structure
      expect(finanSwaggerDocumentation).toHaveProperty('getInitialLoad');
      expect(finanSwaggerDocumentation).toHaveProperty('putMovement');
      expect(finanSwaggerDocumentation).toHaveProperty('updateMovement');
      expect(finanSwaggerDocumentation).toHaveProperty('deleteMovement');
    });

    it('should have valid endpoint configuration', () => {
      // Should contain financial-related endpoints
      expect(finanSwaggerDocumentation.getInitialLoad).toBeDefined();
      expect(finanSwaggerDocumentation.putMovement).toBeDefined();
      expect(finanSwaggerDocumentation.updateMovement).toBeDefined();
      expect(finanSwaggerDocumentation.deleteMovement).toBeDefined();
    });

    it('should have valid endpoint structure', () => {
      // Each endpoint should have path and operation
      expect(finanSwaggerDocumentation.getInitialLoad['/api/finan/initial-load']).toBeDefined();
      expect(finanSwaggerDocumentation.putMovement['/api/finan/insert']).toBeDefined();
      expect(finanSwaggerDocumentation.updateMovement['/api/finan/update/{id}']).toBeDefined();
      expect(finanSwaggerDocumentation.deleteMovement['/api/finan/delete/{id}']).toBeDefined();
    });
  });

  describe('API Endpoints Documentation', () => {
    it('should document initial load endpoint', () => {
      const initialLoadEndpoint = finanSwaggerDocumentation.getInitialLoad['/api/finan/initial-load'];
      expect(initialLoadEndpoint).toBeDefined();
      expect(initialLoadEndpoint.post).toBeDefined();
      expect(initialLoadEndpoint.post.summary).toContain('initial load');
    });

    it('should document movement endpoints', () => {
      const putEndpoint = finanSwaggerDocumentation.putMovement['/api/finan/insert'];
      const updateEndpoint = finanSwaggerDocumentation.updateMovement['/api/finan/update/{id}'];
      const deleteEndpoint = finanSwaggerDocumentation.deleteMovement['/api/finan/delete/{id}'];

      expect(putEndpoint).toBeDefined();
      expect(updateEndpoint).toBeDefined();
      expect(deleteEndpoint).toBeDefined();
    });

    it('should document CRUD operations', () => {
      // Check POST operation
      const postOp = finanSwaggerDocumentation.putMovement['/api/finan/insert'].post;
      expect(postOp).toBeDefined();
      expect(postOp.summary).toBeDefined();

      // Check PUT operation
      const putOp = finanSwaggerDocumentation.updateMovement['/api/finan/update/{id}'].put;
      expect(putOp).toBeDefined();
      expect(putOp.summary).toBeDefined();

      // Check DELETE operation
      const deleteOp = finanSwaggerDocumentation.deleteMovement['/api/finan/delete/{id}'].delete;
      expect(deleteOp).toBeDefined();
      expect(deleteOp.summary).toBeDefined();
    });
  });

  describe('Operation Structure', () => {
    it('should have valid operation properties', () => {
      const postOp = finanSwaggerDocumentation.putMovement['/api/finan/insert'].post;

      expect(postOp).toHaveProperty('summary');
      expect(postOp).toHaveProperty('tags');
      expect(postOp).toHaveProperty('security');
      expect(postOp).toHaveProperty('requestBody');
      expect(postOp).toHaveProperty('responses');
    });

    it('should have valid tags', () => {
      const postOp = finanSwaggerDocumentation.putMovement['/api/finan/insert'].post;
      expect(postOp.tags).toContain('Finance');
    });

    it('should have security configuration', () => {
      const postOp = finanSwaggerDocumentation.putMovement['/api/finan/insert'].post;
      expect(postOp.security).toBeDefined();
      expect(postOp.security[0]).toHaveProperty('bearerAuth');
    });

    it('should have request body configuration', () => {
      const postOp = finanSwaggerDocumentation.putMovement['/api/finan/insert'].post;
      expect(postOp.requestBody).toBeDefined();
      expect(postOp.requestBody.required).toBe(true);
      expect(postOp.requestBody.content).toBeDefined();
    });

    it('should have response configurations', () => {
      const postOp = finanSwaggerDocumentation.putMovement['/api/finan/insert'].post;
      expect(postOp.responses).toBeDefined();
      expect(postOp.responses['201']).toBeDefined();
      expect(postOp.responses['400']).toBeDefined();
      expect(postOp.responses['401']).toBeDefined();
      expect(postOp.responses['500']).toBeDefined();
    });
  });

  describe('Schema Documentation', () => {
    it('should document request schemas', () => {
      const postOp = finanSwaggerDocumentation.putMovement['/api/finan/insert'].post;
      const requestSchema = postOp.requestBody.content['application/json'].schema;

      expect(requestSchema).toBeDefined();
      expect(requestSchema.type).toBe('object');
      expect(requestSchema.required).toBeDefined();
      expect(requestSchema.properties).toBeDefined();
    });

    it('should have required fields in request schema', () => {
      const postOp = finanSwaggerDocumentation.putMovement['/api/finan/insert'].post;
      const requestSchema = postOp.requestBody.content['application/json'].schema;

      expect(requestSchema.required).toContain('movement_name');
      expect(requestSchema.required).toContain('movement_val');
      expect(requestSchema.required).toContain('movement_date');
      expect(requestSchema.required).toContain('movement_type');
      expect(requestSchema.required).toContain('movement_tag');
      expect(requestSchema.required).toContain('currency');
    });

    it('should have valid property types', () => {
      const postOp = finanSwaggerDocumentation.putMovement['/api/finan/insert'].post;
      const properties = postOp.requestBody.content['application/json'].schema.properties;

      expect(properties.movement_name.type).toBe('string');
      expect(properties.movement_val.type).toBe('number');
      expect(properties.movement_date.type).toBe('string');
      expect(properties.movement_type.type).toBe('number');
      expect(properties.movement_tag.type).toBe('string');
      expect(properties.currency.type).toBe('string');
    });
  });

  describe('Response Documentation', () => {
    it('should document success responses', () => {
      const postOp = finanSwaggerDocumentation.putMovement['/api/finan/insert'].post;
      const successResponse = postOp.responses['201'];

      expect(successResponse.description).toBeDefined();
      expect(successResponse.content).toBeDefined();
      expect(successResponse.content['application/json']).toBeDefined();
    });

    it('should document error responses', () => {
      const postOp = finanSwaggerDocumentation.putMovement['/api/finan/insert'].post;

      expect(postOp.responses['400']).toBeDefined();
      expect(postOp.responses['401']).toBeDefined();
      expect(postOp.responses['500']).toBeDefined();
    });

    it('should have meaningful response descriptions', () => {
      const postOp = finanSwaggerDocumentation.putMovement['/api/finan/insert'].post;

      expect(postOp.responses['201'].description.length).toBeGreaterThan(0);
      expect(postOp.responses['400'].description.length).toBeGreaterThan(0);
      expect(postOp.responses['401'].description.length).toBeGreaterThan(0);
      expect(postOp.responses['500'].description.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle all endpoints consistently', () => {
      const endpoints = [
        finanSwaggerDocumentation.getInitialLoad,
        finanSwaggerDocumentation.putMovement,
        finanSwaggerDocumentation.updateMovement,
        finanSwaggerDocumentation.deleteMovement,
      ];

      endpoints.forEach((endpoint) => {
        expect(endpoint).toBeDefined();
        expect(typeof endpoint).toBe('object');
      });
    });

    it('should have consistent operation structure', () => {
      const operations = [
        finanSwaggerDocumentation.putMovement['/api/finan/insert'].post,
        finanSwaggerDocumentation.updateMovement['/api/finan/update/{id}'].put,
        finanSwaggerDocumentation.deleteMovement['/api/finan/delete/{id}'].delete,
      ];

      operations.forEach((operation) => {
        expect(operation).toHaveProperty('summary');
        expect(operation).toHaveProperty('tags');
        expect(operation).toHaveProperty('responses');
      });
    });

    it('should maintain documentation integrity', () => {
      // All endpoints should be properly documented
      expect(Object.keys(finanSwaggerDocumentation).length).toBe(4);
      expect(finanSwaggerDocumentation.getInitialLoad).toBeDefined();
      expect(finanSwaggerDocumentation.putMovement).toBeDefined();
      expect(finanSwaggerDocumentation.updateMovement).toBeDefined();
      expect(finanSwaggerDocumentation.deleteMovement).toBeDefined();
    });
  });

  describe('Documentation Quality', () => {
    it('should have comprehensive summaries', () => {
      const postOp = finanSwaggerDocumentation.putMovement['/api/finan/insert'].post;
      const putOp = finanSwaggerDocumentation.updateMovement['/api/finan/update/{id}'].put;
      const deleteOp = finanSwaggerDocumentation.deleteMovement['/api/finan/delete/{id}'].delete;

      expect(postOp.summary.length).toBeGreaterThan(0);
      expect(putOp.summary.length).toBeGreaterThan(0);
      expect(deleteOp.summary.length).toBeGreaterThan(0);
    });

    it('should have meaningful examples', () => {
      const postOp = finanSwaggerDocumentation.putMovement['/api/finan/insert'].post;
      const properties = postOp.requestBody.content['application/json'].schema.properties;

      expect(properties.movement_name.example).toBeDefined();
      expect(properties.movement_val.example).toBeDefined();
      expect(properties.currency.example).toBeDefined();
    });

    it('should have proper field descriptions', () => {
      const postOp = finanSwaggerDocumentation.putMovement['/api/finan/insert'].post;
      const properties = postOp.requestBody.content['application/json'].schema.properties;

      expect(properties.movement_name.description.length).toBeGreaterThan(0);
      expect(properties.movement_val.description.length).toBeGreaterThan(0);
      expect(properties.currency.description.length).toBeGreaterThan(0);
    });
  });
});
