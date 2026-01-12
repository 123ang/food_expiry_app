import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Check if email is enabled (has credentials)
export const isEmailEnabled = !!(process.env.SMTP_USER && process.env.SMTP_PASS);

// Create transporter for Gmail SMTP (only if credentials are provided)
export const emailTransporter = isEmailEnabled
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS, // App password
      },
    })
  : null;

// Verify connection configuration (only if email is enabled)
if (isEmailEnabled && emailTransporter) {
  emailTransporter.verify((error: Error | null) => {
    if (error) {
      console.error('❌ Email configuration error:', error);
      console.warn('⚠️  Email features will be disabled');
    } else {
    }
  });
} else {
}

// Email templates
export const emailTemplates = {
  groupInvitation: (inviterName: string, groupName: string, inviteCode: string, webLink: string, mobileLink: string) => ({
    subject: `${inviterName} invited you to join "${groupName}" on Expiry Alert`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .invite-code { background: white; border: 2px dashed #22c55e; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 3px; margin: 20px 0; border-radius: 8px; }
          .button { display: inline-block; background: #22c55e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🍎 Expiry Alert</h1>
            <p>Group Invitation</p>
          </div>
          <div class="content">
            <h2>You're Invited!</h2>
            <p><strong>${inviterName}</strong> has invited you to join the group <strong>"${groupName}"</strong> on Expiry Alert.</p>
            
            <p>With Expiry Alert, you can:</p>
            <ul>
              <li>📱 Track food expiry dates together</li>
              <li>🗑️ Reduce food waste as a family</li>
              <li>📊 See analytics on consumption patterns</li>
              <li>🛒 Share shopping lists</li>
            </ul>

            <h3>Your Invite Code:</h3>
            <div class="invite-code">${inviteCode}</div>

            <p style="text-align: center;">
              <a href="${webLink}" class="button">Join on Web</a>
              <a href="${mobileLink}" class="button">Join on Mobile</a>
            </p>

            <p style="font-size: 14px; color: #666;">
              <strong>How to join:</strong><br>
              1. Click one of the buttons above, or<br>
              2. Open the Expiry Alert app and enter the invite code: <strong>${inviteCode}</strong>
            </p>

            <p style="font-size: 12px; color: #999;">
              This invitation will expire in 7 days.
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Expiry Alert. Never let food go to waste again!</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
${inviterName} invited you to join "${groupName}" on Expiry Alert!

Your invite code: ${inviteCode}

Join on web: ${webLink}
Join on mobile: ${mobileLink}

Or open the Expiry Alert app and enter the invite code.

This invitation expires in 7 days.
    `.trim(),
  }),

  passwordReset: (resetLink: string, userName: string) => ({
    subject: 'Reset your Expiry Alert password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #22c55e; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #22c55e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🍎 Expiry Alert</h1>
          </div>
          <div class="content">
            <h2>Password Reset Request</h2>
            <p>Hi ${userName || 'there'},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <p style="text-align: center;">
              <a href="${resetLink}" class="button">Reset Password</a>
            </p>
            <p>If you didn't request this, you can safely ignore this email.</p>
            <p style="font-size: 12px; color: #999;">This link will expire in 1 hour.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Expiry Alert</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Password Reset Request

Hi ${userName || 'there'},

We received a request to reset your password. Click the link below to create a new password:

${resetLink}

If you didn't request this, you can safely ignore this email.

This link will expire in 1 hour.
    `.trim(),
  }),
};

// Helper function to send email
export const sendEmail = async (to: string, subject: string, html: string, text: string) => {
  if (!isEmailEnabled || !emailTransporter) {
    console.warn('⚠️  Email is disabled. Cannot send email to:', to);
    console.warn('⚠️  To enable email, set SMTP_USER and SMTP_PASS in .env file');
    return null;
  }

  try {
    const info = await emailTransporter.sendMail({
      from: process.env.EMAIL_FROM || '"Expiry Alert" <noreply@expiryalert.com>',
      to,
      subject,
      html,
      text,
    });
    return info;
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    throw error;
  }
};

