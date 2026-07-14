import request from 'supertest';
import { buildTestApp } from './helpers/build-test-app';
import { signToken, bearer, TEST_SECRET_KEY } from './helpers/jwt';
import { FinanRepository } from '../../src/modules/finan/application/ports/finan.repository';

process.env.SECRET_KEY = TEST_SECRET_KEY;

jest.mock('../../src/modules/finan/infrastructure/persistence/finan.mysql');

import { FinanMysqlRepository } from '../../src/modules/finan/infrastructure/persistence/finan.mysql';
import { buildFinanModule } from '../../src/modules/finan/infrastructure/config/finan.module';

const MockedFinanMysqlRepository = FinanMysqlRepository as jest.MockedClass<typeof FinanMysqlRepository>;

const mockRepo: jest.Mocked<FinanRepository> = {
  createTableForUser: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  findByNameAndDate: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  getTotalExpenseDay: jest.fn(),
  getMovements: jest.fn(),
  getMovementsByTag: jest.fn(),
  getTotalBalance: jest.fn(),
  getYearlyBalance: jest.fn(),
  getMonthlyBalance: jest.fn(),
  getBalanceUntilDate: jest.fn(),
  getMonthlyExpensesUntilCurrentDay: jest.fn(),
  getMonthlyBudget: jest.fn(),
  getCurrentMonthExpenses: jest.fn(),
  getGeneralInfo: jest.fn(),
  getTripInfo: jest.fn(),
  operateForLinkedMovement: jest.fn(),
};

MockedFinanMysqlRepository.mockImplementation(() => mockRepo as any);

const app = buildTestApp([{ path: '/api/finan', router: buildFinanModule().router }]);

const validMovementBody = {
  movement_name: 'Rent',
  movement_val: 1200,
  movement_date: '2026-07-01',
  movement_type: 1,
  movement_tag: 'housing',
  currency: 'USD',
};

describe('Finan module — integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('auth gate (validateToken) — shared across all finan routes', () => {
    it.each([
      ['POST', '/api/finan/initial-load'],
      ['POST', '/api/finan/insert'],
      ['PUT', '/api/finan/update/1'],
      ['DELETE', '/api/finan/delete/1'],
    ])('rejects %s %s with 401 when no Authorization header is sent', async (method, path) => {
      const res = await (request(app) as any)[method.toLowerCase()](path).send({});
      expect(res.status).toBe(401);
      expect(mockRepo.getMovements).not.toHaveBeenCalled();
    });

    it('rejects requests with an invalid/expired token with 401', async () => {
      const res = await request(app)
        .post('/api/finan/initial-load')
        .set('Authorization', bearer('not-a-real-token'))
        .send({ currency: 'USD' });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /initial-load', () => {
    it('returns the aggregated financial data for a valid request', async () => {
      mockRepo.getTotalExpenseDay.mockResolvedValue([]);
      mockRepo.getMovements.mockResolvedValue([{ id: 1, name: 'Rent' }]);
      mockRepo.getMovementsByTag.mockResolvedValue([]);
      mockRepo.getTotalBalance.mockResolvedValue([]);
      mockRepo.getYearlyBalance.mockResolvedValue([]);
      mockRepo.getMonthlyBalance.mockResolvedValue([]);
      mockRepo.getBalanceUntilDate.mockResolvedValue([]);
      mockRepo.getMonthlyExpensesUntilCurrentDay.mockResolvedValue([]);
      mockRepo.getMonthlyBudget.mockResolvedValue(500);
      mockRepo.getCurrentMonthExpenses.mockResolvedValue(100);

      const res = await request(app)
        .post('/api/finan/initial-load')
        .set('Authorization', bearer(signToken({ username: 'anderokgo' })))
        .send({ currency: 'USD' });

      expect(res.status).toBe(200);
      expect(res.body.data.movements).toEqual([{ id: 1, name: 'Rent' }]);
      expect(res.body.data.remainingBudget).toBe(400);
      // The username is taken from the verified JWT, not the request body.
      expect(mockRepo.getMovements).toHaveBeenCalledWith('anderokgo', 'USD');
    });

    it('returns 400 and never touches the repository when currency is invalid', async () => {
      const res = await request(app)
        .post('/api/finan/initial-load')
        .set('Authorization', bearer(signToken()))
        .send({ currency: 'US' }); // Must be exactly 3 characters

      expect(res.status).toBe(400);
      expect(mockRepo.getMovements).not.toHaveBeenCalled();
    });
  });

  describe('POST /insert', () => {
    it('creates a movement for a valid request', async () => {
      mockRepo.findByNameAndDate.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue({
        id: 1,
        name: 'Rent',
        value: 1200,
        date_movement: '2026-07-01',
        type_source_id: 1,
        tag: 'housing',
        currency: 'USD',
        user: 'testuser',
      });

      const res = await request(app)
        .post('/api/finan/insert')
        .set('Authorization', bearer(signToken({ username: 'testuser' })))
        .send(validMovementBody);

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBe(1);
      expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Rent', user: 'testuser' }));
    });

    it('returns 400 for an incomplete movement body without calling the repository', async () => {
      const res = await request(app)
        .post('/api/finan/insert')
        .set('Authorization', bearer(signToken()))
        .send({ movement_name: '' });

      expect(res.status).toBe(400);
      expect(mockRepo.create).not.toHaveBeenCalled();
    });

    it('returns 400 when the repository throws (PutMovementUseCase catches internally)', async () => {
      mockRepo.findByNameAndDate.mockRejectedValue(new Error('DB connection lost'));

      const res = await request(app)
        .post('/api/finan/insert')
        .set('Authorization', bearer(signToken()))
        .send(validMovementBody);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: true, message: 'DB connection lost' });
    });
  });

  describe('PUT /update/:id', () => {
    it('updates a movement for a valid request', async () => {
      const existing = {
        id: 5,
        name: 'Rent',
        value: 1200,
        date_movement: '2026-07-01',
        type_source_id: 1,
        tag: 'housing',
        currency: 'USD',
        user: 'testuser',
      };
      mockRepo.findById.mockResolvedValue(existing);
      mockRepo.update.mockResolvedValue(existing);

      const res = await request(app)
        .put('/api/finan/update/5')
        .set('Authorization', bearer(signToken({ username: 'testuser' })))
        .send(validMovementBody);

      expect(res.status).toBe(200);
      expect(mockRepo.update).toHaveBeenCalledWith(5, expect.any(Object), 'testuser');
    });

    it('returns 400 and never calls the repository for a non-numeric id', async () => {
      const res = await request(app)
        .put('/api/finan/update/not-a-number')
        .set('Authorization', bearer(signToken()))
        .send(validMovementBody);

      expect(res.status).toBe(400);
      expect(mockRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /delete/:id', () => {
    it('deletes a movement for a valid id', async () => {
      mockRepo.delete.mockResolvedValue(true);

      const res = await request(app)
        .delete('/api/finan/delete/7')
        .set('Authorization', bearer(signToken({ username: 'testuser' })))
        .send({});

      expect(res.status).toBe(200);
      expect(mockRepo.delete).toHaveBeenCalledWith(7, 'testuser');
    });

    it('returns 400 and never calls the repository for a non-numeric id', async () => {
      const res = await request(app)
        .delete('/api/finan/delete/abc')
        .set('Authorization', bearer(signToken()))
        .send({});

      expect(res.status).toBe(400);
      expect(mockRepo.delete).not.toHaveBeenCalled();
    });
  });
});
