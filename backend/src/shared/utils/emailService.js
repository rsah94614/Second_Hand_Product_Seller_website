const nodemailer = require('nodemailer');

/**
 * Create email transporter with proper configuration
 */
const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SMTP credentials are missing');
    }
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Base email template wrapper
 */
const emailTemplate = (title, content) => `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
    <div style="background-color: #0284c7; padding: 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">CampusMitra</h1>
    </div>
    <div style="padding: 32px">
      <h2 style="margin-top: 0; color: #111827;">${title}</h2>
      ${content}
    </div>
    <div style="background-color: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #6b7280;">
      <p style="margin: 0;">© ${new Date().getFullYear()} CampusMitra. All rights reserved.</p>
    </div>
  </div>
`;

/**
 * Send email with fallback to console in development
 */
const sendEmail = async (to, subject, html) => {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.warn('[DEV WARNING] EMAIL_USER or EMAIL_PASS not found in .env variables.');
    console.warn(`[DEV ONLY] Email to ${to}:`);
    console.warn(`Subject: ${subject}`);
    console.warn(`Content: ${html.substring(0, 200)}...`);
    return;
  }

  const mailOptions = {
    from: `"CampusMitra" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email successfully sent to ${to}: ${subject}`);
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    throw new Error('Failed to send email');
  }
};

/**
 * Send password reset email
 */
const sendResetEmail = async (toEmail, resetUrl) => {
  const content = `
    <p style="color: #4b5563; line-height: 1.6;">You're receiving this email because a password reset was requested for your account. If this was you, you can set a new password right away. This link will safely expire in 1 hour.</p>
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="${resetUrl}" style="background-color: #0284c7; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Reset Password</a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">If you didn't request a new password, you can safely ignore this email and your password will remain untouched.</p>
  `;

  await sendEmail(
    toEmail,
    'Action Required: Reset your Password',
    emailTemplate('Password Reset Request', content)
  );
};

/**
 * Send email verification email
 */
const sendVerificationEmail = async (toEmail, verificationUrl, userName) => {
  const content = `
    <p style="color: #4b5563; line-height: 1.6;">Hi ${userName},</p>
    <p style="color: #4b5563; line-height: 1.6;">Welcome to CampusMitra! Please verify your email address to start trading on campus.</p>
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="${verificationUrl}" style="background-color: #0284c7; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Verify Email</a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">This link will expire in 24 hours. If you didn't create an account, please ignore this email.</p>
  `;

  await sendEmail(
    toEmail,
    'Verify Your Email - CampusMitra',
    emailTemplate('Email Verification', content)
  );
};

/**
 * Send registration OTP email
 */
const sendSignupOtpEmail = async (toEmail, code) => {
  const content = `
    <p style="color: #4b5563; line-height: 1.6;">You're almost there! Use the following verification code to complete your registration on CampusMitra.</p>
    
    <div style="text-align: center; margin: 40px 0;">
      <div style="background-color: #f3f4f6; color: #111827; padding: 20px; font-size: 32px; font-weight: 800; letter-spacing: 8px; border-radius: 12px; display: inline-block; border: 1px solid #e5e7eb;">
        ${code}
      </div>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">This code will expire in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
  `;

  await sendEmail(
    toEmail,
    `${code} is your CampusMitra verification code`,
    emailTemplate('Register Your Account', content)
  );
};

/**
 * Send order confirmation email
 */
const sendOrderConfirmationEmail = async (toEmail, orderDetails) => {
  const { orderId, productTitle, totalAmount, sellerName, buyerName, isSeller } = orderDetails;
  
  const content = isSeller ? `
    <p style="color: #4b5563; line-height: 1.6;">You have a new order request!</p>
    <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 8px 0;"><strong>Order ID:</strong> ${orderId}</p>
      <p style="margin: 8px 0;"><strong>Product:</strong> ${productTitle}</p>
      <p style="margin: 8px 0;"><strong>Buyer:</strong> ${buyerName}</p>
      <p style="margin: 8px 0;"><strong>Amount:</strong> ₹${totalAmount}</p>
    </div>
    <p style="color: #4b5563; line-height: 1.6;">Please log in to accept or reject this order.</p>
  ` : `
    <p style="color: #4b5563; line-height: 1.6;">Your order has been placed successfully!</p>
    <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 8px 0;"><strong>Order ID:</strong> ${orderId}</p>
      <p style="margin: 8px 0;"><strong>Product:</strong> ${productTitle}</p>
      <p style="margin: 8px 0;"><strong>Seller:</strong> ${sellerName}</p>
      <p style="margin: 8px 0;"><strong>Amount:</strong> ₹${totalAmount}</p>
    </div>
    <p style="color: #4b5563; line-height: 1.6;">We'll notify you once the seller responds.</p>
  `;

  await sendEmail(
    toEmail,
    `Order ${isSeller ? 'Request' : 'Confirmation'} - CampusMitra`,
    emailTemplate(`Order ${isSeller ? 'Request' : 'Confirmation'}`, content)
  );
};

/**
 * Send notification email
 */
const sendNotificationEmail = async (toEmail, notification) => {
  const { title, message, link } = notification;
  
  const content = `
    <p style="color: #4b5563; line-height: 1.6;">${message}</p>
    ${link ? `
      <div style="text-align: center; margin: 40px 0;">
        <a href="${link}" style="background-color: #0284c7; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">View Details</a>
      </div>
    ` : ''}
  `;

  await sendEmail(
    toEmail,
    title,
    emailTemplate(title, content)
  );
};

/**
 * Send account lockout email
 */
const sendLockoutEmail = async (toEmail, unlockTime) => {
  const content = `
    <p style="color: #4b5563; line-height: 1.6;">We've observed 5 failed login attempts on your account. To protect your security, we've temporarily locked your account.</p>
    
    <div style="background-color: #fef2f2; border: 1px solid #fee2e2; padding: 16px; border-radius: 8px; margin: 24px 0;">
      <p style="margin: 0; color: #991b1b; font-weight: 600; text-align: center;">Locked until: ${unlockTime.toLocaleString()}</p>
    </div>
    
    <p style="color: #4b5563; line-height: 1.6;">If this was you, you can try logging in again after the lockout period expires. If you've forgotten your password, please use the password reset feature.</p>
    
    <p style="color: #6b7280; font-size: 14px; margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 16px;">If you didn't attempt to log in, please reset your password immediately or contact campus support.</p>
  `;

  await sendEmail(
    toEmail,
    'Security Alert: Your account has been temporarily locked',
    emailTemplate('Account Locked', content)
  );
};

module.exports = {
  sendEmail,
  sendResetEmail,
  sendVerificationEmail,
  sendOrderConfirmationEmail,
  sendNotificationEmail,
  sendLockoutEmail,
  sendSignupOtpEmail,
};
