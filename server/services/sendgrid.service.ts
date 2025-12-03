import { MailService } from "@sendgrid/mail";
import { ENV } from '@shared/constants';

// Make SendGrid optional for development - log warnings instead of throwing errors
let mailService: MailService | null = null;
if (process.env.SENDGRID_API_KEY) {
  mailService = new MailService();
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn("⚠️ SENDGRID_API_KEY not set - email functionality will be simulated in console logs");
}

// SendGrid service configuration handled above
interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    if (!mailService) {
      console.log("📧 [DEV] Email simulation - SendGrid not configured");
      console.log(`To: ${params.to}`);
      console.log(`Subject: ${params.subject}`);
      console.log(`Text: ${params.text}`);
      return true; // Simulate success for development
    }
    
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text || "",
      html: params.html || "",
    });
    return true;
  } catch (error) {
    console.error("SendGrid email error:", error);
    return false;
  }
}

export class SendGridEmailService {
  private static readonly FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;

  /**
   * Check if SendGrid is properly configured
   */
  private static isConfigured(): boolean {
    return !!process.env.SENDGRID_API_KEY;
  }

  /**
   * Log email for development/testing when SendGrid fails
   */
  private static logEmailForDev(
    to: string,
    subject: string,
    content: string,
    type: string = "EMAIL",
  ): void {
    console.log(`📧 [${type}] Email would be sent to: ${to}`);
    console.log(`📧 [${type}] Subject: ${subject}`);
    console.log(`📧 [${type}] Content:`);
    console.log(content);
    console.log("----------------------------------------");
  }

  /**
   * Send OTP email to user for verification
   * @param email - Recipient email address
   * @param otp - 6-digit OTP code
   * @param firstName - User's first name
   */
  static async sendOTPEmail(
    email: string,
    otp: string,
    firstName?: string,
  ): Promise<void> {
    const userName = firstName || "User";

    const emailParams: EmailParams = {
      to: email,
      from: this.FROM_EMAIL,
      subject: "Verify your email for Vaulted Assets Platform",
      text: `Hi ${userName},

Your OTP to verify your email address is: ${otp}

This code will expire in 10 minutes.

If you didn't sign up, please ignore this email.

Thank you,
Vaulted Assets Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8F541D;">Verify your email for Vaulted Assets Platform</h2>
          
          <p>Hi ${userName},</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h3 style="color: #8F541D; margin: 0;">Your verification code:</h3>
            <div style="font-size: 32px; font-weight: bold; color: #CF9531; letter-spacing: 5px; margin: 10px 0;">
              ${otp}
            </div>
            <p style="color: #666; font-size: 14px; margin: 0;">This code will expire in 10 minutes</p>
          </div>
          
          <p>If you didn't sign up for Vaulted Assets, please ignore this email.</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated message from Vaulted Assets Platform.<br>
            Please do not reply to this email.
          </p>
        </div>
      `,
    };

    try {
      if (!this.isConfigured()) {
        this.logEmailForDev(
          email,
          emailParams.subject,
          emailParams.text || "",
          "OTP",
        );
        console.log(`📧 [DEV] OTP Code: ${otp}`);
        return;
      }

      const success = await sendEmail(emailParams);
      if (success) {
        console.log(`✅ OTP email sent successfully to ${email}`);
      } else {
        throw new Error("Failed to send email via SendGrid");
      }
    } catch (error: any) {
      console.error("SendGrid email error:", error);
      if (error.response && error.response.body) {
        console.error("SendGrid response body:", error.response.body);
      }     
    }
  }

  /**
   * Send 2FA OTP email to user for login verification
   * @param email - Recipient email address
   * @param firstName - User's first name
   * @param otp - 6-digit OTP code
   */
  static async sendTwoFactorOTP(
    email: string,
    firstName: string,
    otp: string,
  ): Promise<void> {
    const userName = firstName || "User";

    const emailParams: EmailParams = {
      to: email,
      from: this.FROM_EMAIL,
      subject: "Vaulted Assets - Two-Factor Authentication Code",
      text: `Hi ${userName},

Your two-factor authentication code is: ${otp}

This code will expire in 10 minutes.

If you didn't request this login, please secure your account immediately.

Thank you,
Vaulted Assets Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8F541D;">Two-Factor Authentication Code</h2>
          
          <p>Hi ${userName},</p>
          
          <p>Someone is trying to access your Vaulted Assets account. If this is you, use the code below to complete your login:</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h3 style="color: #8F541D; margin: 0;">Your 2FA verification code:</h3>
            <div style="font-size: 32px; font-weight: bold; color: #CF9531; letter-spacing: 5px; margin: 10px 0;">
              ${otp}
            </div>
            <p style="color: #666; font-size: 14px; margin: 0;">This code will expire in 10 minutes</p>
          </div>
          
          <p style="color: #d9534f; font-weight: bold;">
            If you didn't request this login, please secure your account immediately.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated message from Vaulted Assets Platform.<br>
            Please do not reply to this email.
          </p>
        </div>
      `,
    };

    try {
      if (!this.isConfigured()) {
        this.logEmailForDev(
          email,
          emailParams.subject,
          emailParams.text || "",
          "2FA",
        );
        console.log(`📧 [DEV] 2FA Code: ${otp}`);
        return;
      }

      const success = await sendEmail(emailParams);
      if (success) {
        console.log(`✅ 2FA email sent successfully to ${email}`);
      } else {
        throw new Error("Failed to send 2FA email via SendGrid");
      }
    } catch (error) {
      console.error("❌ SendGrid error, falling back to dev logging:", error);
      // Fallback to console logging for development
      this.logEmailForDev(
        email,
        emailParams.subject,
        emailParams.text || "",
        "2FA",
      );
      console.log(`📧 [DEV] 2FA Code: ${otp}`);
    }
  }

  /**
   * Send password reset email
   * @param email - Recipient email address
   * @param resetToken - Password reset token
   * @param firstName - User's first name
   */
  static async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    firstName?: string,
  ): Promise<void> {
    const userName = firstName || "User";
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const emailParams: EmailParams = {
      to: email,
      from: this.FROM_EMAIL,
      subject: "Reset your Vaulted Assets password",
      text: `Hi ${userName},

You requested to reset your password for Vaulted Assets Platform.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this, please ignore this email.

Thank you,
Vaulted Assets Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8F541D;">Reset your Vaulted Assets password</h2>
          
          <p>Hi ${userName},</p>
          
          <p>You requested to reset your password for Vaulted Assets Platform.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${resetUrl}" style="height:50px;v-text-anchor:middle;width:200px;" arcsize="10%" stroke="f" fillcolor="#8F541D">
              <w:anchorlock/>
              <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">Reset Password</center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-->
            <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
              <tr>
                <td style="background-color: #8F541D; border-radius: 5px; padding: 0;">
                  <a href="${resetUrl}" style="background-color: #8F541D; color: white !important; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px; line-height: 1; border: none; mso-padding-alt: 0; font-family: Arial, sans-serif;">
                    Reset Password
                  </a>
                </td>
              </tr>
            </table>
            <!--<![endif]-->
          </div>
          
          <p style="color: #666; font-size: 14px;">
            This link will expire in 1 hour. If the button doesn't work, copy and paste this URL into your browser:
          </p>
          <p style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 14px; color: #333;">
            <a href="${resetUrl}" style="color: #8F541D; text-decoration: underline;">${resetUrl}</a>
          </p>
          
          <p>If you didn't request this password reset, please ignore this email.</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated message from Vaulted Assets Platform.<br>
            Please do not reply to this email.
          </p>
        </div>
      `,
    };

    try {
      if (!this.isConfigured()) {
        this.logEmailForDev(
          email,
          emailParams.subject,
          emailParams.text || "",
          "RESET",
        );
        return;
      }

      const success = await sendEmail(emailParams);
      if (success) {
        console.log(`✅ Password reset email sent successfully to ${email}`);
      } else {
        throw new Error("Failed to send password reset email via SendGrid");
      }
    } catch (error) {
      console.error("❌ SendGrid error, falling back to dev logging:", error);
      // Fallback to console logging for development
      this.logEmailForDev(
        email,
        emailParams.subject,
        emailParams.text || "",
        "RESET",
      );
    }
  }

  /**
   * Send blockchain event notification email
   * @param email - Recipient email address
   * @param firstName - User's first name
   * @param subject - Email subject
   * @param content - Email content
   * @param event - Blockchain event details
   */
  static async sendBlockchainEventEmail(
    email: string,
    firstName: string,
    subject: string,
    content: string,
    event: any
  ): Promise<void> {
    const userName = firstName || "User";
    const dashboardUrl = `${process.env.FRONTEND_URL}/dashboard`;

    const emailParams: EmailParams = {
      to: email,
      from: this.FROM_EMAIL,
      subject: `${subject} - Vaulted Assets`,
      text: `Hi ${userName},

${content}

You can view your portfolio and transaction history in your dashboard:
${dashboardUrl}

Event Details:
- Network: ${event.network}
- Token: ${event.tokenType}
- Transaction Hash: ${event.transactionHash}
- Block: ${event.blockNumber || event.slot || 'N/A'}

Thank you,
Vaulted Assets Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8F541D;">${subject}</h2>
          
          <p>Hi ${userName},</p>
          
          <p>${content}</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #8F541D; margin-top: 0;">Event Details</h3>
            <p><strong>Network:</strong> ${event.network}</p>
            <p><strong>Token:</strong> ${event.tokenType}</p>
            <p><strong>Transaction Hash:</strong> ${event.transactionHash}</p>
          
            ${event.amount ? `<p><strong>Amount:</strong> ${event.amount}</p>` : ''}
            ${event.requestId ? `<p><strong>Request ID:</strong> ${event.requestId}</p>` : ''}
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated message from Vaulted Assets Platform.<br>
            Please do not reply to this email.
          </p>
        </div>
      `,
    };

    const success = await sendEmail(emailParams);

    if (!success) {
      this.logEmailForDev(
        email,
        subject,
        content,
        "BLOCKCHAIN_EVENT",
      );
    }
  }

  /**
   * Send private network transfer notification email
   * @param recipientEmail - Email of the recipient
   * @param recipientName - Name of the recipient
   * @param senderEmail - Email of the sender
   * @param senderName - Name of the sender
   * @param amount - Amount transferred
   * @param tokenType - Type of token (GOLD/SILVER)
   * @param transactionId - Transaction ID
   * @param isSender - Whether this email is for the sender or recipient
   */
  static async sendPrivateTransferNotification(
    recipientEmail: string,
    recipientName: string,
    senderEmail: string,
    senderName: string,
    amount: number,
    tokenType: string,
    transactionId: string,
    isSender: boolean = false
  ): Promise<void> {
    const tokenSymbol = tokenType === 'GOLD' ? 'GRT' : 'SRT';
    const tokenName = tokenType === 'GOLD' ? 'Gold Reserve Token' : 'Silver Reserve Token';
    
    const subject = isSender 
      ? `Private Transfer Sent - ${amount} ${tokenSymbol} Tokens`
      : `Private Transfer Received - ${amount} ${tokenSymbol} Tokens`;
      
    const content = isSender
      ? `You have successfully sent ${amount} ${tokenSymbol} tokens to ${recipientName} (${recipientEmail}) via private network transfer.\n\nTransaction ID: ${transactionId}\n\nThis transfer has been completed on the private Canton network.`
      : `You have received ${amount} ${tokenSymbol} tokens from ${senderName} (${senderEmail}) via private network transfer.\n\nTransaction ID: ${transactionId}\n\nThis transfer has been completed on the private Canton network.`;

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8F541D;">Private Network Transfer ${isSender ? 'Sent' : 'Received'}</h2>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #8F541D; margin: 0 0 15px 0;">Transfer Details</h3>
            <p><strong>Amount:</strong> ${amount} ${tokenSymbol} (${tokenName})</p>
            <p><strong>${isSender ? 'Recipient' : 'Sender'}:</strong> ${isSender ? recipientName : senderName} (${isSender ? recipientEmail : senderEmail})</p>
            <p><strong>Transaction ID:</strong> ${transactionId}</p>
            <p><strong>Network:</strong> Private Canton Network</p>
            <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">Completed</span></p>
          </div>
          
          <p style="color: #666;">
            ${isSender 
              ? `Your ${tokenSymbol} tokens have been successfully transferred to the recipient.`
              : `The ${tokenSymbol} tokens have been added to your wallet balance.`
            }
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated notification from Vaulted Assets Platform.<br>
            Please do not reply to this email.
          </p>
        </div>
      `;

    const emailParams: EmailParams = {
      to: isSender ? senderEmail : recipientEmail,
      from: this.FROM_EMAIL,
      subject: subject,
      text: content,
      html: htmlContent,
    };

    const success = await sendEmail(emailParams);

    if (!success) {
      this.logEmailForDev(
        emailParams.to,
        subject,
        content,
        "PRIVATE_TRANSFER",
      );
    }
  }
}
