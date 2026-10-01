import nodemailer from 'nodemailer';

/**
 * Cleanly extracts and sanitizes email credentials from environment variables
 */
const getCredentials = () => {
  const user = (process.env.EMAIL_USER || '').trim();
  const pass = (process.env.EMAIL_PASS || '').trim().replace(/\s+/g, '');
  return { user, pass };
};

/**
 * Creates and returns a Nodemailer transporter configured with Gmail SMTP
 */
const createTransporter = () => {
  const { user, pass } = getCredentials();

  if (!user || !pass) {
    throw new Error('EMAIL_USER or EMAIL_PASS environment variables are missing');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass,
    },
  });
};

/**
 * Checks and verifies email configuration and SMTP connection status on server startup
 */
export const verifyEmailConfig = async () => {
  const { user, pass } = getCredentials();

  console.log('\n--- Email Service Diagnostic ---');
  console.log(`EMAIL_USER: ${user || '(not set)'}`);
  console.log(`EMAIL_PASS exists: ${Boolean(pass)}`);
  console.log(`EMAIL_PASS length: ${pass ? pass.length : 0} characters`);

  if (!user || !pass || user.includes('your_gmail')) {
    console.warn('Email Service Warning: Please configure valid EMAIL_USER and EMAIL_PASS in .env for live OTP delivery.');
    console.log('--------------------------------\n');
    return;
  }

  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('Email Service: Gmail SMTP connection verified and ready to send.');
  } catch (error) {
    console.error('Email Service Error: SMTP verification failed -', error.message);
  }
  console.log('--------------------------------\n');
};

/**
 * Sends a 6-digit OTP verification email via Gmail SMTP
 * @param {string} toEmail - Recipient email address
 * @param {string} otp - 6-digit plaintext OTP
 */
export const sendSignupOTPEmail = async (toEmail, otp) => {
  const { user } = getCredentials();
  const transporter = createTransporter();

  const mailOptions = {
    from: `"Event Manager" <${user}>`,
    to: toEmail,
    subject: 'Event Manager - Email Verification OTP',
    text: `Your 6-digit verification code is: ${otp}\n\nThis OTP is valid for 5 minutes. Do not share this code with anyone.\n\nIf you did not request this code, please ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #ffffff;">
        <h2 style="color: #1f2937; text-align: center; margin-bottom: 8px;">Event Manager</h2>
        <p style="color: #4b5563; text-align: center; font-size: 16px; margin-top: 0;">Email Verification</p>
        <p style="color: #374151; font-size: 15px; text-align: center;">
          Use the following 6-digit One-Time Password (OTP) to complete your account registration:
        </p>
        <div style="background-color: #f3f4f6; padding: 18px; border-radius: 8px; text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb;">${otp}</span>
        </div>
        <p style="color: #dc2626; font-size: 14px; text-align: center; font-weight: 500;">
          This OTP is valid for 5 minutes.
        </p>
        <p style="color: #6b7280; font-size: 13px; text-align: center; margin-top: 16px;">
          Do not share this code with anyone. If you did not request this registration, you can safely ignore this email.
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`OTP email sent successfully to ${toEmail} (Message ID: ${info.messageId})`);
    return info;
  } catch (error) {
    console.error(`Gmail SMTP Delivery Error for recipient (${toEmail}):`, error.message);
    throw new Error('Failed to send OTP email');
  }
};
