import axios from "axios";
import jwt from "jsonwebtoken";
import { Logger } from "../utils/logger";

interface TransakRefreshTokenResponse {
  accessToken: string;
  expiresAt: number;
  token_type: string;
}

interface TransakSessionResponse {
  session_id: string;
  redirect_url: string;
}

interface TransakSessionRequest {
  fiatCurrency: string;
  cryptoCurrency: string;
  fiatAmount?: number;
  cryptoAmount?: number;
  walletAddress: string;
  email: string;
  partnerCustomerId?: string;
  themeColor?: string;
  redirectURL?: string;
  webhookURL?: string;
  sessionId?: string;
  mode?: string;
}

interface TransakWebhookEvent {
  eventID: string;
  eventType: string;
  id: string;
  status: string;
  fiatCurrency: string;
  cryptoCurrency: string;
  fiatAmount: number;
  cryptoAmount: number;
  walletAddress: string;
  partnerCustomerId: string;
  totalFeeInFiat: number;
  network: string;
  transactionHash?: string;
  transactionLink?: string;
  createdAt: string;
  completedAt?: string;
}

export class TransakService {
  private static readonly API_KEY = "d0969f96-05cb-4162-a822-d21f219b8de1";
  private static readonly SECRET = "MkrOICt1wIWTTU7RBrN+fA==";
  private static readonly BASE_URL = "https://api-stg.transak.com"; // Staging URL

  // Cache for access token
  private static accessTokenCache: {
    token: string;
    expiresAt: number;
  } | null = null;

  /**
   * Get or refresh access token
   */
  static async getAccessToken(): Promise<string> {
    try {
      // Check if we have a valid cached token
      if (
        this.accessTokenCache &&
        Date.now() < this.accessTokenCache.expiresAt
      ) {
        return this.accessTokenCache.token;
      }
      // Refresh token
      const response = await axios.post(
        `${this.BASE_URL}/partners/api/v2/refresh-token`,
        {
          apiKey: this.API_KEY,
          "api-secret": this.SECRET,
        },
        {
          headers: {
            "Content-Type": "application/json",
            apiKey: this.API_KEY,
            "api-secret": this.SECRET,
          },
        },
      );
      const tokenData: TransakRefreshTokenResponse = response.data.data;

      // Cache the token with expiration time (subtract 60 seconds for safety)
      this.accessTokenCache = {
        token: tokenData.accessToken,
        expiresAt: tokenData.expiresAt,
      };

      Logger.info("Transak access token refreshed successfully");
      return tokenData.accessToken;
    } catch (error: any) {
      Logger.error("Error refreshing Transak access token:", error);
      throw new Error(`Failed to refresh access token: ${error.message}`);
    }
  }

  /**
   * Create a payment session
   */
  static async createSession(
    data: TransakSessionRequest,
  ): Promise<TransakSessionResponse> {
    try {
      // const accessToken = await this.getAccessToken();
      // console.log('HERELLLLLLLLL', accessToken)

      const sessionPayload = {
        referrerDomain: "mits.net",
        fiatCurrency: data.fiatCurrency,
        cryptoCurrencyCode: data.mode == "SELL" ? "" : data.cryptoCurrency,
        fiatAmount: data.fiatAmount,
        productsAvailed: data.mode == "SELL" ? "SELL" : "BUY",
        network: "polygon",
        disableWalletAddressForm: true,
        defaultCryptoAmount: data.mode == "BUY" ? "" : data.fiatAmount,
        // cryptoAmount: data.cryptoAmount,
        walletAddress: "0xaB4dbDD5Fb141E08Da7b3E77C08fc706aF2D1Fcc",
        email: data.email,
        partnerCustomerId: data.partnerCustomerId,
        themeColor: data.themeColor || "#D4AF37", // Vaulted Assets gold color
        redirectURL:
          data.redirectURL ||
          `${process.env.BASE_URL || "https://dev-user.mits.net"}/assets`,
        webhookURL:
          data.webhookURL ||
          `${process.env.BASE_URL || "https://dev-user.mits.net"}/api/transak/webhook`,
        environment: "STAGING", // Using staging mode for development
        isAutoFillUserData: true,
        hideMenu: false,
        sessionId: data.sessionId,
        isFeeCalculationHidden: false,
      };
      console.log("HERELLLLLLLLL sessionPayload", sessionPayload);
      const response = await axios.post(
        `${this.BASE_URL || "https://api-stg.transak.com"}/auth/public/v2/session`,
        { widgetParams: sessionPayload },
        {
          headers: {
            "access-token": `${data.sessionId}`,
            "Content-Type": "application/json",
          },
        },
      );

      Logger.info("Transak session created successfully", {
        sessionId: response.data.session_id,
      });
      return response.data;
    } catch (error: any) {
      Logger.error("Error creating Transak session:", error);
      throw new Error(`Failed to create session: ${error.message}`);
    }
  }

  /**
   * Get redirect URL for payment
   */
  static getRedirectUrl(sessionId: string): string {
    return `https://global-stg.transak.com?apiKey=${this.API_KEY}&sessionId=${sessionId}`;
  }

  /**
   * Decrypt Transak webhook payload
   */
  static async decryptWebhookPayload(
    encryptedData: string,
  ): Promise<TransakWebhookEvent> {
    try {
      // Get access token for decryption
      const accessToken = await this.getAccessToken();

      // Decrypt the JWT payload using the access token
      const decodedData = jwt.verify(encryptedData, accessToken) as any;

      Logger.info("Transak webhook payload decrypted successfully");
      return decodedData;
    } catch (error: any) {
      Logger.error("Error decrypting Transak webhook payload:", error);
      throw new Error(`Failed to decrypt webhook payload: ${error.message}`);
    }
  }

  /**
   * Map Transak status to internal purchase status
   */
  static mapTransakStatusToPurchaseStatus(
    transakStatus: string,
  ): "pending" | "processing" | "completed" | "failed" {
    switch (transakStatus.toLowerCase()) {
      case "awaiting_payment_from_user":
      case "created":
        return "pending";
      case "payment_done_marked_by_user":
      case "processing":
      case "pending_delivery_from_transak":
        return "processing";
      case "completed":
        return "completed";
      case "failed":
      case "cancelled":
      case "expired":
      case "refunded":
        return "failed";
      default:
        Logger.warn(
          `Unknown Transak status: ${transakStatus}, defaulting to pending`,
        );
        return "pending";
    }
  }
}
