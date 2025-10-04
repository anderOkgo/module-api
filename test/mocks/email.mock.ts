// Mock for email service to prevent SMTP connection attempts during tests
const mockSendEmail = jest.fn().mockImplementation(() => {
  // Do nothing - just prevent the actual email sending
  return Promise.resolve();
});

export default mockSendEmail;
