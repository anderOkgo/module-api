import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';
import dotenv from 'dotenv';

// Function to send an email
function sendEmail(to: string, subject: string, message: string): Promise<void> {
  dotenv.config();
  const transporter: Transporter = nodemailer.createTransport({
    host: process.env.EMAILHOST!,
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAILUSER!,
      pass: process.env.EMAILPASSWORD!,
    },
  });

  const mailOptions: SendMailOptions = {
    from: process.env.EMAILDUMMY!,
    to: to,
    subject: subject,
    text: message,
  };

  // Return a Promise
  return new Promise((resolve, reject) => {
    // Send email
    transporter.sendMail(mailOptions, (error: Error | null, info: any) => {
      if (error) {
        console.log('Error occurred:', error.message);
        reject(error); // Reject the promise with the error
      } else {
        console.log('Email sent successfully!');
        console.log('Message ID:', info.messageId);
        resolve(); // Resolve the promise
      }
    });
  });
}

export default sendEmail;
