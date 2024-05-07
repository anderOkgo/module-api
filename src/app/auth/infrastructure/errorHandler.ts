import sendEmail from '../../../helpers/lib/email';
export const systemErrors: string[] = [];
import dotenv from 'dotenv';

export const handleSystemErrors = async () => {
  dotenv.config();

  // Check if process.env.EMAILERRORS is defined, if not, provide a default email address
  const emailAddress = process.env.EMAILERRORS ?? 'default@example.com';
  const errorMessage = systemErrors ?? 'No error message provided';
  sendEmail(emailAddress, 'system Errors', `The following errors have occurred: ${errorMessage}`);

  // Clear system errors after sending the report
  systemErrors?.splice(0, systemErrors.length);
};
