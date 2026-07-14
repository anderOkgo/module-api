import express from 'express';
import request from 'supertest';
import { uploadMiddleware } from '../../../src/infrastructure/services/upload';

// Unlike upload.simple.test.ts / upload.integration.test.ts, this file does NOT mock
// multer or ImageProcessor: it drives the real fileFilter (upload.ts lines 7-13) through
// an actual multipart request, since the other two files mock multer entirely and never
// invoke the real fileFilter callback.
describe('Upload Service - real fileFilter', () => {
  const app = express();
  app.post('/upload', uploadMiddleware, (req, res) => {
    res.status(200).json({ success: true, hasFile: !!(req as any).file });
  });

  it('should accept a file with a valid image mimetype', async () => {
    const response = await request(app)
      .post('/upload')
      .attach('image', Buffer.from('fake-image-bytes'), { filename: 'photo.png', contentType: 'image/png' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, hasFile: true });
  });

  it('should reject a file with an invalid mimetype', async () => {
    const response = await request(app)
      .post('/upload')
      .attach('image', Buffer.from('not-an-image'), { filename: 'notes.txt', contentType: 'text/plain' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid file type. Only images (JPEG, PNG, WebP) are allowed.');
  });
});
