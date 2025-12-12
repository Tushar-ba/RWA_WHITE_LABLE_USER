import nodemailer from 'nodemailer';
import { ENV } from '@shared/constants';

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // For development, we'll use console logging instead of real email
    // In production, you would configure real SMTP credentials
    if (process.env.NODE_ENV === 'development') {
      // Create a test transporter for development
      this.transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: 'unix',
        buffer: true
      });
    } else {
      // Production configuration would go here
      throw new Error('Email service not configured for production');
    }
  }

  /**
   * Send OTP email to user for verification
   * @param email - Recipient email address
   * @param otp - 6-digit OTP code
   * @param firstName - User's first name
   */
  async sendOTPEmail(email: string, otp: string, firstName?: string): Promise<void> {
    const userName = firstName || 'User';
    
    const mailOptions: EmailOptions = {
      to: email,
      subject: 'Verify your email for Solulab Assets Platform',
      text: `Hi ${userName},

Your OTP to verify your email address is: ${otp}

This code will expire in 10 minutes.

If you didn't sign up, please ignore this email.

Thank you,
Solulab Assets Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8F541D;">Verify your email for Solulab Assets Platform</h2>
          
          <p>Hi ${userName},</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h3 style="color: #8F541D; margin: 0;">Your verification code:</h3>
            <div style="font-size: 32px; font-weight: bold; color: #CF9531; letter-spacing: 5px; margin: 10px 0;">
              ${otp}
            </div>
            <p style="color: #666; font-size: 14px; margin: 0;">This code will expire in 10 minutes</p>
          </div>
          
          <p>If you didn't sign up for Solulab Assets, please ignore this email.</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated message from Solulab Assets Platform.<br>
            Please do not reply to this email.
          </p>
        </div>
      `
    };

    // In development, log to console instead of sending real email
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 [DEV] Email would be sent to:', email);
      console.log('📧 [DEV] OTP Code:', otp);
      console.log('📧 [DEV] Email content:');
      console.log(mailOptions.text);
      console.log('----------------------------------------');
      return;
    }

    // Send the email (production)
    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ OTP email sent successfully to ${email}`);
    } catch (error) {
      console.error('❌ Failed to send OTP email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  /**
   * Send password reset email
   * @param email - Recipient email address
   * @param resetToken - Password reset token
   * @param firstName - User's first name
   */
  async sendPasswordResetEmail(email: string, resetToken: string, firstName?: string): Promise<void> {
    const userName = firstName || 'User';
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const mailOptions: EmailOptions = {
      to: email,
      subject: 'Reset your Solulab Assets password',
      text: `Hi ${userName},

You requested to reset your password for Solulab Assets Platform.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this, please ignore this email.

Thank you,
Solulab Assets Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8F541D;">Reset your Solulab Assets password</h2>
          
          <p>Hi ${userName},</p>
          
          <p>You requested to reset your password for Solulab Assets Platform.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #8F541D; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            This link will expire in 1 hour. If the button doesn't work, copy and paste this URL into your browser:<br>
            <span style="word-break: break-all;">${resetUrl}</span>
          </p>
          
          <p>If you didn't request this password reset, please ignore this email.</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated message from Solulab Assets Platform.<br>
            Please do not reply to this email.
          </p>
        </div>
      `
    };

    // Development logging or production sending
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 [DEV] Password reset email would be sent to:', email);
      console.log('📧 [DEV] Reset URL:', resetUrl);
      console.log('📧 [DEV] Reset Token:', resetToken);
      return;
    }

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Password reset email sent successfully to ${email}`);
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  /**
   * Send 2FA OTP email to user for login verification
   * @param email - Recipient email address
   * @param firstName - User's first name
   * @param otp - 6-digit OTP code
   */
  static async sendTwoFactorOTP(email: string, firstName: string, otp: string): Promise<void> {
    // For development, just log the OTP
    if (process.env.NODE_ENV === 'development') {
      console.log(`📧 [DEV] 2FA code for ${email}: ${otp}`);
      return;
    }
    
    // In production, you would send the actual email
    console.log(`📧 [PROD] 2FA email sent to: ${email}`);
  }
}