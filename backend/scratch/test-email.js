const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const createTransporter = () => {
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '********' : 'MISSING');

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('SMTP credentials are missing');
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });
};

const testEmail = async () => {
  const transporter = createTransporter();
  const mailOptions = {
    from: `"CampusMitra Test" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER, // Send to self
    subject: 'Test Email',
    text: 'If you receive this, the email service is working.',
  };

  try {
    console.log('Sending test email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
};

testEmail();
