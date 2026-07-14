import request from 'supertest';
import { buildTestApp } from './helpers/build-test-app';
import { signToken, signAdminToken, bearer, TEST_SECRET_KEY } from './helpers/jwt';
import { SeriesWriteRepository } from '../../src/modules/series/application/ports/series-write.repository';
import { SeriesReadRepository } from '../../src/modules/series/application/ports/series-read.repository';

process.env.SECRET_KEY = TEST_SECRET_KEY;

jest.mock('../../src/modules/series/infrastructure/persistence/series-write.mysql');
jest.mock('../../src/modules/series/infrastructure/persistence/series-read.mysql');

import { SeriesWriteMysqlRepository } from '../../src/modules/series/infrastructure/persistence/series-write.mysql';
import { SeriesReadMysqlRepository } from '../../src/modules/series/infrastructure/persistence/series-read.mysql';
import { buildSeriesModule } from '../../src/modules/series/infrastructure/config/series.module';

const MockedWriteRepo = SeriesWriteMysqlRepository as jest.MockedClass<typeof SeriesWriteMysqlRepository>;
const MockedReadRepo = SeriesReadMysqlRepository as jest.MockedClass<typeof SeriesReadMysqlRepository>;

const mockWrite: jest.Mocked<SeriesWriteRepository> = {
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  updateImage: jest.fn(),
  assignGenres: jest.fn(),
  removeGenres: jest.fn(),
  addTitles: jest.fn(),
  removeTitles: jest.fn(),
  updateRank: jest.fn(),
};

const mockRead: jest.Mocked<SeriesReadRepository> = {
  findById: jest.fn(),
  findByNameAndYear: jest.fn(),
  findAll: jest.fn(),
  search: jest.fn(),
  getProductions: jest.fn(),
  getGenres: jest.fn(),
  getDemographics: jest.fn(),
  getProductionYears: jest.fn(),
};

MockedWriteRepo.mockImplementation(() => mockWrite as any);
MockedReadRepo.mockImplementation(() => mockRead as any);

const app = buildTestApp([{ path: '/api/series', router: buildSeriesModule().router }]);

const sampleSeries = {
  id: 10,
  name: 'Sample Series',
  chapter_numer: 12,
  year: 2023,
  description: 'desc',
  description_en: 'desc en',
  qualification: 8,
  demography_id: 1,
  visible: true,
  image: '/img/tarjeta/10.jpg',
};

describe('Series module — integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRead.getDemographics.mockResolvedValue([{ id: 1, name: 'Shounen' }]);
    mockRead.getGenres.mockResolvedValue([{ id: 1, name: 'Action' }]);
  });

  describe('admin-gated routes — shared auth checks (validateAdmin)', () => {
    const adminRoutes: Array<[string, string]> = [
      ['POST', '/api/series/create-complete'],
      ['PUT', '/api/series/10'],
      ['DELETE', '/api/series/10'],
      ['POST', '/api/series/10/genres'],
      ['DELETE', '/api/series/10/genres'],
      ['POST', '/api/series/10/titles'],
      ['DELETE', '/api/series/10/titles'],
    ];

    it.each(adminRoutes)('rejects %s %s with 401 when no token is sent', async (method, path) => {
      const res = await (request(app) as any)[method.toLowerCase()](path).send({});
      expect(res.status).toBe(401);
    });

    it.each(adminRoutes)('rejects %s %s with 403 for a non-admin token', async (method, path) => {
      const res = await (request(app) as any)[method.toLowerCase()](path)
        .set('Authorization', bearer(signToken({ role: 2 })))
        .send({});
      expect(res.status).toBe(403);
    });
  });

  describe('GET /list (validateToken)', () => {
    it('rejects with 401 when no token is sent', async () => {
      const res = await request(app).get('/api/series/list');
      expect(res.status).toBe(401);
    });

    it('returns paginated series for a valid token', async () => {
      mockRead.findAll.mockResolvedValue({ series: [sampleSeries as any], total: 1 });

      const res = await request(app)
        .get('/api/series/list?limit=10&offset=0')
        .set('Authorization', bearer(signToken()));

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([sampleSeries]);
      expect(res.body.pagination).toEqual({ limit: 10, offset: 0, total: 1 });
    });
  });

  describe('GET /:id (public)', () => {
    it('returns a series when found', async () => {
      mockRead.findById.mockResolvedValue(sampleSeries as any);

      const res = await request(app).get('/api/series/10');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(sampleSeries);
    });

    it('returns 404 when not found', async () => {
      mockRead.findById.mockResolvedValue(null);

      const res = await request(app).get('/api/series/999');

      expect(res.status).toBe(404);
    });
  });

  describe('POST /search (public)', () => {
    it('returns matching series', async () => {
      mockRead.search.mockResolvedValue([sampleSeries as any]);

      const res = await request(app).post('/api/series/search').send({ name: 'Sample' });

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(1);
      expect(res.body.data).toEqual([sampleSeries]);
    });
  });

  describe('GET /genres and GET /demographics (public)', () => {
    it('returns the genre catalog', async () => {
      const res = await request(app).get('/api/series/genres');
      expect(res.status).toBe(200);
      expect(res.body.genres).toEqual([{ id: 1, name: 'Action' }]);
    });

    it('returns the demographic catalog', async () => {
      const res = await request(app).get('/api/series/demographics');
      expect(res.status).toBe(200);
      expect(res.body.demographics).toEqual([{ id: 1, name: 'Shounen' }]);
    });
  });

  describe('GET /years (public)', () => {
    it('returns the available production years', async () => {
      mockRead.getProductionYears.mockResolvedValue([{ year: 2023 } as any]);

      const res = await request(app).get('/api/series/years');

      expect(res.status).toBe(200);
      expect(res.body.years).toEqual([{ year: 2023 }]);
    });
  });

  describe('POST / (getProductions, public boot endpoint)', () => {
    it('returns productions for a valid filter body', async () => {
      mockRead.getProductions.mockResolvedValue([sampleSeries as any]);

      const res = await request(app).post('/api/series/').send({ limit: '20' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual([sampleSeries]);
    });

    it('returns 400 for a malformed filter body without calling the repository', async () => {
      const res = await request(app).post('/api/series/').send({ id: 'not-numeric-and-not-comma-list-@@' });

      expect(res.status).toBe(400);
      expect(mockRead.getProductions).not.toHaveBeenCalled();
    });
  });

  describe('POST /create (validateAdmin + image upload)', () => {
    it('rejects with 401 when no token is sent', async () => {
      const res = await request(app).post('/api/series/create').field('name', 'New Series');
      expect(res.status).toBe(401);
    });

    it('creates a series for a valid admin request without an image', async () => {
      mockRead.findByNameAndYear.mockResolvedValue(null);
      mockWrite.create.mockResolvedValue({ id: 20 });
      mockWrite.updateRank.mockResolvedValue();
      mockRead.findById.mockResolvedValue({ ...sampleSeries, id: 20, name: 'New Series' } as any);

      const res = await request(app)
        .post('/api/series/create')
        .set('Authorization', bearer(signAdminToken()))
        .field('name', 'New Series')
        .field('chapter_number', '12')
        .field('year', '2024')
        .field('qualification', '9')
        .field('demography_id', '1')
        .field('visible', 'true');

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBe(20);
      expect(mockWrite.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'New Series' }));
    });
  });

  describe('POST /create-complete (validateAdmin)', () => {
    it('creates a series with relations for a valid admin request', async () => {
      mockRead.findByNameAndYear.mockResolvedValue(null);
      mockWrite.create.mockResolvedValue({ id: 30 });
      mockWrite.updateRank.mockResolvedValue();
      mockRead.findById.mockResolvedValue({ ...sampleSeries, id: 30 } as any);

      const res = await request(app)
        .post('/api/series/create-complete')
        .set('Authorization', bearer(signAdminToken()))
        .send({
          name: 'Complete Series',
          chapter_number: 12,
          year: 2024,
          qualification: 9,
          demography_id: 1,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.id).toBe(30);
    });
  });

  describe('PUT /:id (validateAdmin + image upload)', () => {
    it('updates a series for a valid admin request', async () => {
      mockRead.findById.mockResolvedValue(sampleSeries as any);
      mockWrite.update.mockResolvedValue();
      mockWrite.updateRank.mockResolvedValue();

      const res = await request(app)
        .put('/api/series/10')
        .set('Authorization', bearer(signAdminToken()))
        .field('name', 'Updated Name');

      expect(res.status).toBe(200);
      expect(mockWrite.update).toHaveBeenCalledWith(10, expect.objectContaining({ name: 'Updated Name' }));
    });
  });

  describe('DELETE /:id (validateAdmin)', () => {
    it('soft-deletes a series for a valid admin request', async () => {
      mockRead.findById.mockResolvedValue(sampleSeries as any);
      mockWrite.delete.mockResolvedValue(true);

      const res = await request(app).delete('/api/series/10').set('Authorization', bearer(signAdminToken()));

      expect(res.status).toBe(200);
      expect(mockWrite.delete).toHaveBeenCalledWith(10);
    });

    it('returns 404 when the series does not exist', async () => {
      mockRead.findById.mockResolvedValue(null);

      const res = await request(app).delete('/api/series/999').set('Authorization', bearer(signAdminToken()));

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /:id/image (validateAdmin + image upload)', () => {
    // A minimal but genuinely valid 1x1 PNG — the real (unmocked) sharp-based image
    // pipeline runs in this integration test, so it needs real image bytes to process.
    const tinyPng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64'
    );

    it('updates the series image for a valid admin request', async () => {
      mockRead.findById.mockResolvedValue(sampleSeries as any);
      mockWrite.updateImage.mockResolvedValue(true);

      const res = await request(app)
        .put('/api/series/10/image')
        .set('Authorization', bearer(signAdminToken()))
        .attach('image', tinyPng, { filename: 'cover.png', contentType: 'image/png' });

      expect(res.status).toBe(200);
      expect(mockWrite.updateImage).toHaveBeenCalledWith(10, expect.any(String));
    });

    it('returns 400 when no image file is attached', async () => {
      mockRead.findById.mockResolvedValue(sampleSeries as any);

      const res = await request(app)
        .put('/api/series/10/image')
        .set('Authorization', bearer(signAdminToken()))
        .send();

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('No image sent');
      expect(mockWrite.updateImage).not.toHaveBeenCalled();
    });
  });

  describe('POST /:id/genres and DELETE /:id/genres (validateAdmin)', () => {
    it('assigns genres for a valid admin request', async () => {
      mockRead.findById.mockResolvedValue(sampleSeries as any);
      mockWrite.assignGenres.mockResolvedValue(true);

      const res = await request(app)
        .post('/api/series/10/genres')
        .set('Authorization', bearer(signAdminToken()))
        .send({ genreIds: [1] });

      expect(res.status).toBe(200);
      expect(mockWrite.assignGenres).toHaveBeenCalledWith(10, [1]);
    });

    it('removes genres for a valid admin request', async () => {
      mockRead.findById.mockResolvedValue(sampleSeries as any);
      mockWrite.removeGenres.mockResolvedValue(true);

      const res = await request(app)
        .delete('/api/series/10/genres')
        .set('Authorization', bearer(signAdminToken()))
        .send({ genreIds: [1] });

      expect(res.status).toBe(200);
      expect(mockWrite.removeGenres).toHaveBeenCalledWith(10, [1]);
    });
  });

  describe('POST /:id/titles and DELETE /:id/titles (validateAdmin)', () => {
    it('adds titles for a valid admin request', async () => {
      mockRead.findById.mockResolvedValue(sampleSeries as any);
      mockWrite.addTitles.mockResolvedValue(true);

      const res = await request(app)
        .post('/api/series/10/titles')
        .set('Authorization', bearer(signAdminToken()))
        .send({ titles: ['Alt Title'] });

      expect(res.status).toBe(200);
      expect(mockWrite.addTitles).toHaveBeenCalledWith(10, ['Alt Title']);
    });

    it('removes titles for a valid admin request', async () => {
      mockRead.findById.mockResolvedValue(sampleSeries as any);
      mockWrite.removeTitles.mockResolvedValue(true);

      const res = await request(app)
        .delete('/api/series/10/titles')
        .set('Authorization', bearer(signAdminToken()))
        .send({ titleIds: [5] });

      expect(res.status).toBe(200);
      expect(mockWrite.removeTitles).toHaveBeenCalledWith(10, [5]);
    });
  });
});
