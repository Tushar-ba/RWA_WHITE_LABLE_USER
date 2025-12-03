import { MoonPay } from '@moonpay/moonpay-node';
import { Logger } from '../utils/logger';
import crypto from 'crypto';

export class MoonPayService {
  private static instance: MoonPayService | null = null;
  private moonpay: MoonPay;

  private constructor() {
    const secretKey = process.env.MOONPAY_SECRET_KEY || 'sk_test_2lYeiKTqkKt3BQkR7UQzOINVFjkkwiR2';
    if (!secretKey) {
      throw new Error('MOONPAY_SECRET_KEY environment variable is required');
    }
    
    this.moonpay = new MoonPay(secretKey);
    Logger.info('MoonPay service initialized');
  }

  public static getInstance(): MoonPayService {
    if (!MoonPayService.instance) {
      MoonPayService.instance = new MoonPayService();
    }
    return MoonPayService.instance;
  }

  /**
   * Generate a signed MoonPay checkout URL
   * Following official MoonPay documentation: https://dev.moonpay.com/docs/on-ramp-enhance-security-using-signed-urls
   */
  public generateSignedUrl(params: {
    currencyCode: string;
    baseCurrencyAmount: number;
    baseCurrencyCode: string;
    walletAddress: string;
    externalTransactionId?: string;
    externalCustomerId?: string;
    redirectURL?: string;
  }): string {
    try {
      const baseUrl = process.env.MOONPAY_BASE_URL
      const publicKey = process.env.MOONPAY_PUBLIC_KEY 
      const secretKey = process.env.MOONPAY_SECRET_KEY
      
      if (!publicKey) {
        throw new Error('MOONPAY_PUBLIC_KEY environment variable is required');
      }
      
      if (!secretKey) {
        throw new Error('MOONPAY_SECRET_KEY environment variable is required');
      }

      // Build query parameters
      const queryParams = new URLSearchParams({
        apiKey: publicKey,
        currencyCode:'usdc',
        defaultCurrencyCode: 'usdc',
        baseCurrencyAmount: params.baseCurrencyAmount.toString(),
        lockAmount:'true',
        baseCurrencyCode: 'usd',
        walletAddress: params.walletAddress,
        ...(params.externalTransactionId && { externalTransactionId: params.externalTransactionId }),
         redirectURL: 'http://localhost:3000/assets'
        // ...(params.externalCustomerId && { externalCustomerId: params.externalCustomerId }),
        // ...(params.redirectURL && { redirectURL: params.redirectURL })
      });

      const originalUrl = `${baseUrl}?${queryParams.toString()}`;
      
      // Generate signature manually following MoonPay documentation
      // Use the query string part of the URL as the message
      const queryString = `?${queryParams.toString()}`;
      
      const signature = crypto
        .createHmac('sha256', secretKey)
        .update(queryString)
        .digest('base64');
      
      if (!signature) {
        throw new Error('Failed to generate signature');
      }
      console.log('Generated signature:', signature)
      // Add signature to URL (URL-encoded)
      const signedUrl = `${originalUrl}&signature=${encodeURIComponent(signature)}`;
      
      Logger.info('Generated signed MoonPay URL', { 
        currencyCode: params.currencyCode,
        baseCurrencyAmount: params.baseCurrencyAmount,
        walletAddress: params.walletAddress 
      });
      
      return signedUrl;
      
    } catch (error: any) {
      Logger.error('Error generating MoonPay signed URL:', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature using HMAC SHA256
   * Following MoonPay webhook signature format: Moonpay-Signature-V2: t=timestamp,s=signature
   * Reference: https://dev.moonpay.com/reference/reference-webhooks-signature
   */
  public verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      const webhookSecret = this.getWebhookSecret();
      const SIGNATURE_VALID_FOR = 30; // seconds
      
      // Parse MoonPay signature format: "t=1663064622,s=cdd18ef9d85c004638f0e9f770231909d24053b503a8f281991e33280a7a9ba9"
      const elements = signature.split(',');
      let timestamp: number = 0;
      let receivedSignature: string = '';
      
      for (const element of elements) {
        const [prefix, value] = element.split('=');
        if (prefix === 't') {
          timestamp = parseInt(value);
        } else if (prefix === 's') {
          receivedSignature = value;
        }
      }
      
      if (!timestamp || !receivedSignature) {
        Logger.warn('Invalid MoonPay signature format - missing timestamp or signature');
        return false;
      }
      
      // Validate timestamp (within 30 seconds for security)
      const currentTime = Math.round(Date.now() / 1000);
      if (currentTime - timestamp > SIGNATURE_VALID_FOR) {
        Logger.warn('MoonPay webhook timestamp too old', { timestamp, currentTime, diff: currentTime - timestamp });
        return false;
      }
      
      // Generate expected signature using MoonPay format: timestamp.payload
      const expectedSignature = crypto.createHmac('sha256', webhookSecret)
        .update(timestamp + '.' + payload)
        .digest('hex');
      
      // Use timing-safe comparison
      const isValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(receivedSignature, 'hex')
      );
      
      if (!isValid) {
        Logger.warn('MoonPay webhook signature verification failed');
      }
      
      return isValid;
    } catch (error: any) {
      Logger.error('Error verifying MoonPay webhook signature:', error);
      return false;
    }
  }

  /**
   * Get webhook secret for manual verification if needed
   */
  public getWebhookSecret(): string {
    const webhookSecret = process.env.MOONPAY_WEBHOOK_SECRET || 'wk_test_su5UFHH6R3pGt6ldI5XLcBzWnNM4GRZ';
    if (!webhookSecret) {
      throw new Error('MOONPAY_WEBHOOK_SECRET environment variable is required');
    }
    return webhookSecret;
  }
}