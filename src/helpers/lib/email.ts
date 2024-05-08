import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';
import dotenv from 'dotenv';

function sendSafeEmail(to: string, subject: string, message: string): Promise<void> {
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

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error: Error | null, info: any) => {
      if (error) {
        console.log('Error occurred:', (error as Error).message);
        reject(error);
      } else {
        console.log('Email sent successfully!');
        console.log('Message ID:', info.messageId);
        resolve();
      }
    });
  });
}

// Function to send an email (with potential system crash)
function sendEmail(to: string, subject: string, message: string) {
  sendSafeEmail(to, subject, message)
    .then(() => {
      console.log('Email sent successfully!');
    })
    .catch((error) => {
      console.error('Error occurred while sending email:', error.message);
    });
}

export default sendEmail;
