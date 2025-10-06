import sendEmail from '../../../src/infrastructure/services/email';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Mock nodemailer
jest.mock('nodemailer');
jest.mock('dotenv');

const mockNodemailer = nodemailer as jest.Mocked<typeof nodemailer>;
const mockDotenv = dotenv as jest.Mocked<typeof dotenv>;

describe('Email Service', () => {
  let mockTransporter: any;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock console methods
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();

    // Mock environment variables
    process.env.EMAILHOST = 'smtp.gmail.com';
    process.env.EMAILUSER = 'test@example.com';
    process.env.EMAILPASSWORD = 'testpassword';
    process.env.EMAILDUMMY = 'noreply@example.com';

    // Mock transporter
    mockTransporter = {
      sendMail: jest.fn(),
    };

    mockNodemailer.createTransport.mockReturnValue(mockTransporter);
    mockDotenv.config.mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    jest.restoreAllMocks();
  });

  describe('sendEmail (default export)', () => {
    it('should send email successfully', async () => {
      // Arrange
      const mockInfo = { messageId: 'test-message-id' };
      mockTransporter.sendMail.mockImplementation((options, callback) => {
        callback(null, mockInfo);
      });

      // Act
      sendEmail('test@example.com', 'Test Subject', 'Test Message');

      // Wait for async operation
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Assert
      expect(mockDotenv.config).toHaveBeenCalled();
      expect(mockNodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: 'test@example.com',
          pass: 'testpassword',
        },
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        {
          from: 'noreply@example.com',
          to: 'test@example.com',
          subject: 'Test Subject',
          text: 'Test Message',
        },
        expect.any(Function)
      );

      expect(consoleSpy).toHaveBeenCalledWith('Email sent successfully!');
    });

    it('should handle email sending error', async () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const mockError = new Error('SMTP connection failed');
      mockTransporter.sendMail.mockImplementation((options, callback) => {
        callback(mockError, null);
      });

      // Act
      sendEmail('test@example.com', 'Test Subject', 'Test Message');

      // Wait for async operation
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error occurred while sending email:',
        'SMTP connection failed'
      );
    });

    it('should create transporter with correct configuration', async () => {
      // Arrange
      mockTransporter.sendMail.mockImplementation((options, callback) => {
        callback(null, { messageId: 'test' });
      });

      // Act
      sendEmail('test@example.com', 'Test', 'Test');

      // Wait for async operation
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Assert
      expect(mockNodemailer.createTransport).toHaveBeenCalledWith({
        host: process.env.EMAILHOST,
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAILUSER,
          pass: process.env.EMAILPASSWORD,
        },
      });
    });

    it('should send mail with correct options', async () => {
      // Arrange
      const to = 'recipient@example.com';
      const subject = 'Test Subject';
      const message = 'Test Message Body';

      mockTransporter.sendMail.mockImplementation((options, callback) => {
        callback(null, { messageId: 'test' });
      });

      // Act
      sendEmail(to, subject, message);

      // Wait for async operation
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Assert
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        {
          from: process.env.EMAILDUMMY,
          to: to,
          subject: subject,
          text: message,
        },
        expect.any(Function)
      );
    });
  });

  describe('Environment Variables', () => {
    it('should use environment variables for email configuration', async () => {
      // Arrange
      const customEnv = {
        EMAILHOST: 'custom.smtp.com',
        EMAILUSER: 'custom@example.com',
        EMAILPASSWORD: 'custompassword',
        EMAILDUMMY: 'custom@noreply.com',
      };

      Object.assign(process.env, customEnv);
      mockTransporter.sendMail.mockImplementation((options, callback) => {
        callback(null, { messageId: 'test' });
      });

      // Act
      sendEmail('test@example.com', 'Test', 'Test');

      // Wait for async operation
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Assert
      expect(mockNodemailer.createTransport).toHaveBeenCalledWith({
        host: 'custom.smtp.com',
        port: 465,
        secure: true,
        auth: {
          user: 'custom@example.com',
          pass: 'custompassword',
        },
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'custom@noreply.com',
        }),
        expect.any(Function)
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle null error in sendMail callback', async () => {
      // Arrange
      mockTransporter.sendMail.mockImplementation((options, callback) => {
        callback(null, null);
      });

      // Act
      sendEmail('test@example.com', 'Test', 'Test');

      // Wait for async operation
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('Email sent successfully!');
    });

    it('should handle undefined info in sendMail callback', async () => {
      // Arrange
      mockTransporter.sendMail.mockImplementation((options, callback) => {
        callback(null, undefined);
      });

      // Act
      sendEmail('test@example.com', 'Test', 'Test');

      // Wait for async operation
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('Email sent successfully!');
    });
  });
});
