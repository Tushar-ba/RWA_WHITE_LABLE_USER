import crypto from 'crypto';
import axios from 'axios';

interface SumsubConfig {
  ENABLED: boolean;
  ACCESS_TOKEN: string;
  SECRET_KEY: string;
  WEBHOOK_SECRET: string;
  ENVIRONMENT: 'sandbox' | 'production';
}

export class SumsubService {
  private static config: SumsubConfig = {
    ENABLED: true, // Set to true to use Sumsub sandbox environment
    // ACCESS_TOKEN: 'sbx:jlybqtU3YXpUENTLnahyugay.dqtaLkxlwcPXXNhRmOCp86H9q0yvlu2o', // Your Sumsub App Token
    // SECRET_KEY: 'vIYavzZHN6xsWB7l9alTOLqDIzH14yUA', // Your Sumsub Secret Key
    ACCESS_TOKEN: 'sbx:qrnGAwabKoSS1sYcVOtYSQ2V.1adXoArgOlLrVsiA4UPJyaC8yJmvL9Nr', // Your Sumsub App Token
    SECRET_KEY: 'Ujr2mA1PHERzIKzJaCAKHeLSkBcY4Pbu', // Your Sumsub Secret Key
    WEBHOOK_SECRET: '8bnYp9mMvLpQBlMke2fHdGetIh0',
    ENVIRONMENT: 'sandbox' as const,
  };

  private static getBaseUrl(): string {
    return this.config.ENVIRONMENT === 'sandbox' 
      ? 'https://api.sumsub.com' 
      : 'https://api.sumsub.com';
  }

  /**
   * Generate signature for Sumsub API requests
   */
  private static generateSignature(method: string, url: string, timestamp: number, body?: string): string {
    const message = timestamp + method.toUpperCase() + url + (body || '');
    return crypto.createHmac('sha256', this.config.SECRET_KEY).update(message).digest('hex');
  }

  /**
   * Make authenticated request to Sumsub API
   */
  private static async makeRequest(method: string, endpoint: string, data?: any): Promise<any> {
    if (!this.config.ENABLED) {
      console.log('📧 [DEV] Sumsub simulation - Service not enabled');
      return { simulatedResponse: true };
    }

    const url = `${this.getBaseUrl()}${endpoint}`;
    const timestamp = Math.floor(Date.now() / 1000);
    const body = data ? JSON.stringify(data) : undefined;
    const signature = this.generateSignature(method, endpoint, timestamp, body);

    const headers = {
      'X-App-Token': this.config.ACCESS_TOKEN,
      'X-App-Access-Sig': signature,
      'X-App-Access-Ts': timestamp.toString(),
      'Content-Type': 'application/json',
    };

    try {
      const response = await axios({
        method,
        url,
        headers,
        data,
      });
      return response.data;
    } catch (error: any) {
      console.error('Sumsub API error:', error.response?.data || error.message);
      throw new Error(`Sumsub API error: ${error.response?.data?.description || error.message}`);
    }
  }

  /**
   * Create a new applicant for KYC verification
   */
  static async createApplicant(userId: string, userInfo: { email: string; firstName?: string; lastName?: string }): Promise<string> {
    const applicantData = {
      externalUserId: userId,
      info: {
        firstName: userInfo.firstName || '',
        lastName: userInfo.lastName || '',
        email: userInfo.email,
      },
    };

    if (!this.config.ENABLED) {
      console.log('📧 [DEV] Sumsub simulation - Created applicant for user:', userId);
      return `simulated-applicant-${userId}`;
    }

    const response = await this.makeRequest('POST', '/resources/applicants', applicantData);
    return response.id;
  }

  /**
   * Get appropriate verification level based on user type
   */
  static getVerificationLevel(userType: 'individual' | 'institutional' = 'individual'): string {
    return userType === 'institutional' ? 'basic-kyb-level' : 'id-and-liveness';
  }

  /**
   * Generate SDK access token for WebSDK initialization
   * Based on: https://docs.sumsub.com/docs/get-started-with-web-sdk#generate-sdk-access-token
   */
  static async generateSDKAccessToken(
    userId: string,
    userInfo: { email: string; phone?: string },
    levelName: string = 'id-and-liveness', // Default level name since Sumsub requires it
    ttlInSecs: number = 600
  ): Promise<string> {
    if (!this.config.ENABLED) {
      console.log('📧 [DEV] Sumsub simulation - Generated SDK access token for user:', userId);
      return `simulated-sdk-token-${userId}`;
    }

    const tokenData = {
      userId,                           // External user ID (required)
      applicantIdentifiers: {           // User identifiers (required)
        email: userInfo.email,
        ...(userInfo.phone && { phone: userInfo.phone })
      },
      ttlInSecs,                       // Token expiration time (required)
      levelName                        // Level name (required by Sumsub API)
    };

    console.log('[Sumsub] Generating SDK access token with data:', tokenData);

    try {
      const response = await this.makeRequest('POST', '/resources/accessTokens/sdk', tokenData);
      console.log('[Sumsub] ✅ Successfully generated SDK access token');
      return response.token;
    } catch (error: any) {
      console.error('[Sumsub] ❌ Failed to generate SDK access token:', error);
      
      // Handle specific errors for SDK access token generation
      if (error.message.includes('404') || error.message.includes('not found')) {
        throw new Error(
          `❌ VERIFICATION LEVEL NOT FOUND\n\n` +
          `The level '${levelName}' doesn't exist in your Sumsub account.\n\n` +
          `🔧 SOLUTION OPTIONS:\n` +
          `1. Create a level named '${levelName}' in your Sumsub dashboard\n` +
          `2. OR use a default level by omitting levelName parameter\n` +
          `3. OR check existing levels in https://cockpit.sumsub.com/\n\n` +
          `💡 SDK can work without pre-configured levels if you omit levelName.`
        );
      } else if (error.message.includes('400')) {
        // Try without levelName for default behavior
        console.log('[Sumsub] Retrying SDK token generation without specific level...');
        const defaultTokenData = {
          userId,
          applicantIdentifiers: userInfo,
          ttlInSecs
        };
        
        try {
          const retryResponse = await this.makeRequest('POST', '/resources/accessTokens/sdk', defaultTokenData);
          console.log('[Sumsub] ✅ Successfully generated SDK access token with default level');
          return retryResponse.token;
        } catch (retryError: any) {
          throw new Error(`Sumsub SDK token generation failed: ${retryError.message}`);
        }
      } else {
        throw error;
      }
    }
  }

  /**
   * Get applicant status and verification results
   */
  static async getApplicantStatus(applicantId: string): Promise<{
    reviewStatus: string;
    reviewResult: {
      reviewAnswer: string;
      rejectLabels?: string[];
      reviewRejectType?: string;
    };
  }> {
    if (!this.config.ENABLED) {
      console.log('📧 [DEV] Sumsub simulation - Retrieved status for applicant:', applicantId);
      return {
        reviewStatus: 'pending',
        reviewResult: {
          reviewAnswer: 'GREEN',
        },
      };
    }

    const response = await this.makeRequest('GET', `/resources/applicants/${applicantId}/status`);
    return response;
  }

  /**
   * Handle webhook from Sumsub about applicant status changes
   */
  static async handleWebhook(payload: Buffer, signature: string,algo: string): Promise<boolean> {
    // Verify webhook signature
    // const expectedSignature = crypto
    //   .createHmac('sha256', this.config.SECRET_KEY)
    //   .update(JSON.stringify(payload))
    //   .digest('hex');
    const secretToUse = this.config.WEBHOOK_SECRET || this.config.SECRET_KEY;
      
    if (!secretToUse) {
      console.error('No webhook secret configured. Cannot verify webhook signature.');
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha512', secretToUse)
      .update(payload.toString('utf8'))
      .digest('hex');


    if (signature !== expectedSignature && this.config.ENABLED) {
      throw new Error('Invalid webhook signature');
    }

    console.log('📧 Sumsub webhook received:', payload);
    return true;
  }

  /**
   * Map Sumsub status to our KYC status
   */
  static mapSumsubStatus(reviewStatus: string, reviewAnswer: string): 'pending' | 'approved' | 'rejected' | 'review' {
    if (reviewStatus === 'pending' || reviewStatus === 'queued') {
      return 'pending';
    }

    if (reviewStatus === 'completed') {
      switch (reviewAnswer) {
        case 'GREEN':
          return 'approved';
        case 'RED':
          return 'rejected';
        case 'YELLOW':
          return 'review';
        default:
          return 'pending';
      }
    }

    return 'pending';
  }

  /**
   * Get available verification levels
   */
  static async getAvailableLevels(): Promise<any[]> {
    if (!this.config.ENABLED) {
      console.log('📧 [DEV] Sumsub simulation - Available levels: id-and-liveness');
      return [{ name: 'id-and-liveness', type: 'INDIVIDUAL' }];
    }

    try {
      const response = await this.makeRequest('GET', '/resources/applicantLevels');
      return response.items || [];
    } catch (error) {
      console.error('Error fetching Sumsub levels:', error);
      return [];
    }
  }

  /**
   * Get the first available verification level name
   */
  private static async getFirstAvailableLevel(): Promise<string> {
    try {
      const levels = await this.getAvailableLevels();
      if (levels && levels.length > 0) {
        return levels[0].name;
      }
    } catch (error) {
      console.error('Error getting available levels:', error);
    }
    // Fallback to common default level names
    return 'id-and-liveness';
  }

  /**
   * Check if verification level exists
   */
  private static async isLevelExists(levelName: string): Promise<boolean> {
    try {
      const levels = await this.getAvailableLevels();
      return levels.some(level => level.name === levelName);
    } catch (error) {
      console.error('Error checking level existence:', error);
      return false;
    }
  }

  /**
   * Check if KYC is enabled
   */
  static isEnabled(): boolean {
    return this.config.ENABLED;
  }

  /**
   * Generate external WebSDK link for KYC verification
   * Based on Sumsub API documentation: https://docs.sumsub.com/reference/generate-websdk-external-link
   */
  static async generateWebSDKExternalLink(
    userId: string, 
    userInfo: { email: string; phone?: string },
    levelName: string = 'individual-kyc',
    ttlInSecs: number = 1800
  ): Promise<string> {
    if (!this.config.ENABLED) {
      console.log('📧 [DEV] Sumsub simulation - Generated WebSDK external link for user:', userId);
      return `http://localhost:3000/kyc-simulation?userId=${userId}`;
    }

    // Prepare request data according to Sumsub API documentation
    const requestData = {
      levelName,                    // REQUIRED: Level name must be included in body
      userId,                       // REQUIRED: External user ID
      applicantIdentifiers: {       // REQUIRED: Email and phone for applicant
        email: userInfo.email,
        ...(userInfo.phone && { phone: userInfo.phone })
      },
      ttlInSecs                     // REQUIRED: Link expiration time
    };

    console.log(`[Sumsub] Generating external WebSDK link`);
    console.log(`[Sumsub] Level: ${levelName}`);
    console.log(`[Sumsub] User: ${userId}`);
    console.log(`[Sumsub] Request data:`, requestData);

    try {
      // Use the correct API endpoint as per documentation
      const response = await this.makeRequest('POST', '/resources/sdkIntegrations/levels/-/websdkLink', requestData);
      console.log(`[Sumsub] ✅ Successfully generated external link`);
      return response.url;
    } catch (error: any) {
      console.error(`[Sumsub] ❌ Failed to generate external link:`, error);

      // Enhanced error handling based on Sumsub documentation
      if (error.message.includes('404') || error.message.includes('not found')) {
        // Get available levels for better error message
        const availableLevels = await this.getAvailableLevels();
        const levelNames = availableLevels.map(level => level.name).join(', ');
        throw new Error(
          `Sumsub level '${levelName}' not found. Available levels: ${levelNames || 'None found'}. ` +
          `Please check your Sumsub dashboard and create a verification level. ` +
          `Current API: ${this.getBaseUrl()}`
        );
      } else if (error.message.includes('401') || error.message.includes('403')) {
        throw new Error(
          `Sumsub authentication failed. Please check your API credentials (ACCESS_TOKEN and SECRET_KEY). ` +
          `Make sure your token has the correct permissions for level operations.`
        );
      } else if (error.message.includes('400')) {
        throw new Error(
          `Sumsub bad request. This might be due to invalid user data or level configuration. ` +
          `Error: ${error.message}`
        );
      } else {
        throw new Error(`Sumsub API error: ${error.message}`);
      }
    }
  }

  /**
   * Alternative method using applicant creation approach
   * This is a fallback if WebSDK external link doesn't work
   */
  static async generateWebSDKLinkViaApplicant(
    userId: string, 
    userInfo: { email: string; firstName?: string; lastName?: string; phone?: string },
    levelName?: string,
    ttlInSecs: number = 1800
  ): Promise<{ url?: string; applicantId: string; accessToken: string }> {
    if (!this.config.ENABLED) {
      console.log('📧 [DEV] Sumsub simulation - Generated WebSDK link via applicant for user:', userId);
      return {
        applicantId: `simulated-applicant-${userId}`,
        accessToken: `simulated-token-${userId}`,
        url: `http://localhost:3000/kyc-simulation?userId=${userId}`
      };
    }

    try {
      // Create applicant first (this doesn't require a level)
      const applicantId = await this.createApplicant(userId, {
        email: userInfo.email,
        firstName: userInfo.firstName,
        lastName: userInfo.lastName
      });

      console.log(`[Sumsub] Created applicant ${applicantId}`);

      // For access token, try without level first (this approach works for accounts without pre-configured levels)
      let accessToken: string;
      try {
        console.log(`[Sumsub] Attempting to generate access token without specific level...`);
        // Use the simpler access token endpoint for applicants
        const tokenResponse = await this.makeRequest(
          'POST', 
          `/resources/accessTokens?userId=${userId}`,
          {}
        );
        accessToken = tokenResponse.token;
        console.log(`[Sumsub] ✅ Successfully generated access token using simple approach`);
      } catch (simpleError: any) {
        console.log(`[Sumsub] Simple approach failed, trying with applicant ID...`);
        // Try with applicant-based approach
        const tokenResponse = await this.makeRequest(
          'POST', 
          `/resources/accessTokens?userId=${applicantId}`,
          {}
        );
        accessToken = tokenResponse.token;
        console.log(`[Sumsub] ✅ Successfully generated access token using applicant ID`);
      }

      return {
        applicantId,
        accessToken,
        url: undefined
      };

    } catch (error: any) {
      console.error(`[Sumsub] Failed to generate WebSDK link via applicant:`, error);
      throw error;
    }
  }

  /**
   * Get configuration for frontend
   */
  static getClientConfig() {
    return {
      enabled: this.config.ENABLED,
      environment: this.config.ENVIRONMENT,
    };
  }
}