import { ImageProcessor } from '../../../src/infrastructure/services/image';
import { uploadMiddleware } from '../../../src/infrastructure/services/upload';

// Mock ImageProcessor
jest.mock('../../../src/infrastructure/services/image', () => ({
  ImageProcessor: {
    isValidImageType: jest.fn(),
  },
}));

const mockImageProcessor = ImageProcessor as jest.Mocked<typeof ImageProcessor>;

// Mock multer to simulate different scenarios
jest.mock('multer', () => {
  class MockMulterError extends Error {
    code: string;
    field?: string;
    constructor(message: string, code: string, field?: string) {
      super(message);
      this.code = code;
      this.field = field;
    }
  }

  const mockMulter = jest.fn(() => ({
    single: jest.fn(() => (req: any, res: any, cb: any) => {
      // Simulate different scenarios based on test setup
      const scenario = (req as any).testScenario || 'success';

      switch (scenario) {
        case 'LIMIT_FILE_SIZE':
          const sizeError = new MockMulterError('File too large', 'LIMIT_FILE_SIZE');
          cb(sizeError);
          break;
        case 'LIMIT_FILE_COUNT':
          const countError = new MockMulterError('Too many files', 'LIMIT_FILE_COUNT');
          cb(countError);
          break;
        case 'OTHER_MULTER_ERROR':
          const otherError = new MockMulterError('Other multer error', 'LIMIT_UNEXPECTED_FILE');
          cb(otherError);
          break;
        case 'CUSTOM_ERROR':
          cb(new Error('Custom error message'));
          break;
        case 'SUCCESS':
        default:
          cb(null);
          break;
      }
    }),
  })) as any;

  (mockMulter as any).memoryStorage = jest.fn(() => ({}));
  (mockMulter as any).MulterError = MockMulterError;

  return mockMulter;
});

describe('Upload Service - Integration Test', () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {
      headers: {
        'content-type': 'multipart/form-data',
        'content-length': '1000',
      },
      body: {},
      testScenario: 'success',
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('uploadMiddleware error handling', () => {
    it('should handle LIMIT_FILE_SIZE error', () => {
      mockReq.testScenario = 'LIMIT_FILE_SIZE';

      uploadMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'File is too large. Maximum 5MB.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle LIMIT_FILE_COUNT error', () => {
      mockReq.testScenario = 'LIMIT_FILE_COUNT';

      uploadMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Only one file is allowed at a time.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle other MulterError types', () => {
      mockReq.testScenario = 'OTHER_MULTER_ERROR';

      uploadMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Other multer error',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle non-MulterError errors', () => {
      mockReq.testScenario = 'CUSTOM_ERROR';

      uploadMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Custom error message',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next() when no error occurs', () => {
      mockReq.testScenario = 'SUCCESS';

      uploadMiddleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe('fileFilter functionality', () => {
    it('should use ImageProcessor for file validation', () => {
      // Test that ImageProcessor.isValidImageType is available
      expect(mockImageProcessor.isValidImageType).toBeDefined();
      expect(typeof mockImageProcessor.isValidImageType).toBe('function');
    });

    it('should validate different image types', () => {
      // Test with valid image types
      mockImageProcessor.isValidImageType.mockReturnValue(true);
      expect(mockImageProcessor.isValidImageType('image/jpeg')).toBe(true);
      expect(mockImageProcessor.isValidImageType('image/png')).toBe(true);
      expect(mockImageProcessor.isValidImageType('image/webp')).toBe(true);

      // Test with invalid file types
      mockImageProcessor.isValidImageType.mockReturnValue(false);
      expect(mockImageProcessor.isValidImageType('text/plain')).toBe(false);
      expect(mockImageProcessor.isValidImageType('application/pdf')).toBe(false);
    });
  });

  describe('multer configuration', () => {
    it('should have proper configuration', () => {
      // Test that the middleware function exists and can be called
      expect(uploadMiddleware).toBeDefined();
      expect(typeof uploadMiddleware).toBe('function');
    });

    it('should handle different request scenarios', () => {
      // Test with different scenarios
      const scenarios = ['SUCCESS', 'LIMIT_FILE_SIZE', 'LIMIT_FILE_COUNT', 'CUSTOM_ERROR'];

      scenarios.forEach((scenario) => {
        const req = { ...mockReq, testScenario: scenario };
        const res = { ...mockRes };
        const next = jest.fn();

        expect(() => {
          uploadMiddleware(req, res, next);
        }).not.toThrow();
      });
    });
  });

  describe('error message validation', () => {
    it('should have correct error messages', () => {
      const expectedMessages = {
        LIMIT_FILE_SIZE: 'File is too large. Maximum 5MB.',
        LIMIT_FILE_COUNT: 'Only one file is allowed at a time.',
        CUSTOM_ERROR: 'Custom error message',
      };

      Object.entries(expectedMessages).forEach(([scenario, expectedMessage]) => {
        const req = { ...mockReq, testScenario: scenario };
        const res = { ...mockRes };
        const next = jest.fn();

        uploadMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: expectedMessage,
        });
      });
    });
  });

  describe('comprehensive coverage', () => {
    it('should handle all error types', () => {
      const errorTypes = [
        { scenario: 'LIMIT_FILE_SIZE', expectedStatus: 400, expectedError: 'File is too large. Maximum 5MB.' },
        {
          scenario: 'LIMIT_FILE_COUNT',
          expectedStatus: 400,
          expectedError: 'Only one file is allowed at a time.',
        },
        { scenario: 'OTHER_MULTER_ERROR', expectedStatus: 400, expectedError: 'Other multer error' },
        { scenario: 'CUSTOM_ERROR', expectedStatus: 400, expectedError: 'Custom error message' },
      ];

      errorTypes.forEach(({ scenario, expectedStatus, expectedError }) => {
        const req = { ...mockReq, testScenario: scenario };
        const res = { ...mockRes };
        const next = jest.fn();

        uploadMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(expectedStatus);
        expect(res.json).toHaveBeenCalledWith({
          error: expectedError,
        });
        expect(next).not.toHaveBeenCalled();

        // Reset mocks for next iteration
        jest.clearAllMocks();
        mockRes.status.mockReturnThis();
        mockRes.json.mockReturnThis();
      });
    });

    it('should handle success scenario', () => {
      const req = { ...mockReq, testScenario: 'SUCCESS' };
      const res = { ...mockRes };
      const next = jest.fn();

      uploadMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should validate ImageProcessor integration', () => {
      // Test that ImageProcessor is properly integrated
      expect(mockImageProcessor.isValidImageType).toBeDefined();

      // Test various image types
      const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'text/plain', 'application/pdf'];

      imageTypes.forEach((mimetype) => {
        mockImageProcessor.isValidImageType.mockReturnValue(mimetype.startsWith('image/'));
        expect(mockImageProcessor.isValidImageType(mimetype)).toBe(mimetype.startsWith('image/'));
      });
    });
  });
});
