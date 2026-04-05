const nodemailer = require('nodemailer');

const sendResetEmail = async (toEmail, resetUrl) => {
  // If no credentials are provided in the environment, fallback to console logging
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️ [DEV WARNING] EMAIL_USER or EMAIL_PASS not found in .env variables.');
    console.warn(`⚠️ [DEV ONLY] Falling back to terminal. URL for ${toEmail}: ${resetUrl}`);
    return;
  }

  // Create reusable transporter object using the default SMTP transport
  const transporter = nodemailer.createTransport({
    service: 'gmail', // This is set up seamlessly for Gmail App Passwords
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"CampusMitra" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Action Required: Reset your Password',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="background-color: #0284c7; padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">CampusMitra</h1>
        </div>
        <div style="padding: 32px">
          <h2 style="margin-top: 0; color: #111827;">Password Reset Request</h2>
          <p style="color: #4b5563; line-height: 1.6;">You're receiving this email because a password reset was requested for your account. If this was you, you can set a new password right away. This link will safely expire in 1 hour.</p>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${resetUrl}" style="background-color: #0284c7; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Reset Password</a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">If you didn't request a new password, you can safely ignore this email and your password will remain untouched.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email successfully dispatched to ${toEmail}`);
  } catch (error) {
    console.error(`❌ Failed to dispatch password reset email to ${toEmail}:`, error);
    throw new Error('Failed to send email');
  }
};

module.exports = {
  sendResetEmail,
};
