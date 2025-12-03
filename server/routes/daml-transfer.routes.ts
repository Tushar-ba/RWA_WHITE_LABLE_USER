import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireKycApproval } from "../middleware/kyc.middleware";
import { storage } from "../storage/index.js";
import {
  createUserToken,
  generateMultiPartyToken,
  getContractIdBySymbol,
} from "../utils/canton.utils";
import axios from "axios";
import { SendGridEmailService } from "../services/sendgrid.service.js";

const router = Router();

/**
 * Execute private network token transfer (gifting)
 * POST /api/daml/transfer
 */
router.post("/transfer", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    const { recipient, amount, message } = req.body;

    if (!recipient || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message:
          "Recipient and amount are required, amount must be greater than 0",
      });
    }

    // Get full user object to fetch username and partyId
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.username || !user.partyId) {
      return res.status(400).json({
        success: false,
        message:
          "User must have username and partyId configured for private network transfers",
      });
    }

    // Step 1: Check balance using DAML balance API for specific token type
    console.log(`Checking balance for user: ${user.partyId}`);
    const username = user.username;
    const tokenType = message === "GOLD" ? "GOLD" : "SILVER";

    const userToken = createUserToken(username);
    console.log(`Generated user token: ${userToken}`);
    
    // Get contract IDs to identify token types
    const goldContractId = await getContractIdBySymbol("GLD");
    const silverContractId = await getContractIdBySymbol("SLV");
    console.log(`Gold Contract ID: ${goldContractId}`);
    console.log(`Silver Contract ID: ${silverContractId}`);
    
    // Query all Token contracts for the user
    const balanceResponse = await axios.post(
      `${process.env.CANTON_API_BASE_URL}/query`,
      {
        templateIds: [
          "323be96aa0b9cd4a6f9cf17a5096b7a69c0cc2da28d31baa5e53c72f2c8ce9c1:TokenExample:Token",
        ],
        query: {
          owner: user.partyId,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      },
    );

    const contracts = balanceResponse.data.result || [];
    console.log(`Found ${contracts.length} total token contracts for user`);

    // Calculate balances for both token types and filter by the requested type
    let goldBalance = 0;
    let silverBalance = 0;
    
    for (const contract of contracts) {
      const payload = contract.payload;
      console.log(`Contract payload: ${JSON.stringify(payload)}`);
      
      if (payload && payload.amount) {
        const amount = parseFloat(payload.amount) || 0;
        
        // Check if this contract has a symbol field to identify token type
        if (payload.symbol === "GLD") {
          goldBalance += amount;
        } else if (payload.symbol === "SLV") {
          silverBalance += amount;
        } else {
          // If no symbol field, we need to make assumptions based on contract data
          // This is a fallback - ideally the contract should have clear identification
          console.log(`Contract without symbol found with amount: ${amount}`);
          
          // For now, let's split evenly or use some other logic
          // You may need to adjust this based on your actual contract structure
          if (contracts.length === 2) {
            // If there are exactly 2 contracts, assume first is GOLD, second is SILVER
            const index = contracts.indexOf(contract);
            if (index === 0) {
              goldBalance += amount;
            } else {
              silverBalance += amount;
            }
          } else {
            // Single contract case - need more specific logic
            goldBalance += amount; // Default assumption
          }
        }
      }
    }

    console.log(`User GOLD balance: ${goldBalance}, SILVER balance: ${silverBalance}`);
    
    const tokenBalance = tokenType === "GOLD" ? goldBalance/10**18 : silverBalance/10**18;
    console.log(`User ${tokenType} balance: ${tokenBalance}, Required amount: ${amount}`);

    if (tokenBalance < amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient ${tokenType} balance. Available: ${tokenBalance}, Required: ${amount}`,
      });
    }

    // Step 2: Generate multi-party token

    const bankPartyId =
      "NewBank::1220b845dcf0d9cf52ce1e7457a744a6f3de7eff4a9ee95261b69405d1e0de8a768d";
    const tokenName = `${user.username}_bank_token`;
    const parties = [user.partyId, bankPartyId];

    const multipartToken = generateMultiPartyToken(tokenName, parties);
    console.log(`Generated multi-party token: ${multipartToken}`);

    // Step 4: Execute transfer API
    console.log(
      `Executing transfer: ${amount} tokens from ${user.partyId} to ${recipient}`,
    );

    const transferGoldContractId = await getContractIdBySymbol("GLD");
    // Get silver contract ID
    const transferSilverContractId = await getContractIdBySymbol("SLV");

    const contract = message === "GOLD" ? transferGoldContractId : transferSilverContractId;
    console.log(`Gold contract ID: ${contract}`);
    const transferResponse = await axios.post(
      `${process.env.CANTON_API_BASE_URL}/exercise`,
      {
        templateId:
          "323be96aa0b9cd4a6f9cf17a5096b7a69c0cc2da28d31baa5e53c72f2c8ce9c1:TokenExample:AssetRegistry",
        contractId: contract,
        choice: "Transfer",
        argument: {
          sender: user.partyId,
          recipient: recipient,
          amount: amount,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${multipartToken}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      },
    );

    console.log("Transfer completed successfully:", transferResponse.data);

    // Send email notifications to both sender and recipient
    try {
      // Find recipient user by partyId
      const recipientUser = await storage.getUserByPartyId(recipient);
      
      if (recipientUser && recipientUser.email) {
        console.log(`Sending transfer notifications - Sender: ${user.email}, Recipient: ${recipientUser.email}`);
        
        // Send email to sender (user who initiated the transfer)
        await SendGridEmailService.sendPrivateTransferNotification(
          recipientUser.email,
          `${recipientUser.first_name || 'User'} ${recipientUser.last_name || ''}`.trim() || 'User',
          user.email!,
          `${user.first_name || 'User'} ${user.last_name || ''}`.trim() || 'User',
          amount,
          message || 'GOLD',
          transferResponse.data?.result?.transactionId || "unknown",
          true // isSender = true
        );
        
        // Send email to recipient
        await SendGridEmailService.sendPrivateTransferNotification(
          recipientUser.email,
          `${recipientUser.first_name || 'User'} ${recipientUser.last_name || ''}`.trim() || 'User',
          user.email!,
          `${user.first_name || 'User'} ${user.last_name || ''}`.trim() || 'User',
          amount,
          message || 'GOLD',
          transferResponse.data?.result?.transactionId || "unknown",
          false // isSender = false
        );
        
        console.log('Private transfer email notifications sent successfully');
      } else {
        console.warn(`Recipient user not found for partyId: ${recipient}`);
      }
    } catch (emailError) {
      console.error('Error sending private transfer email notifications:', emailError);
      // Don't fail the transfer if email fails
    }

    // Return success response with transfer details
    res.status(200).json({
      success: true,
      message: "Private network transfer completed successfully",
      data: {
        transactionId:
          transferResponse.data?.result?.transactionId || "unknown",
        sender: user.partyId,
        recipient: recipient,
        amount: amount,
        message: message,
        contractId: contract,
        tokenName: tokenName,
        balanceAfterTransfer: totalBalance - amount,
      },
    });
  } catch (error: any) {
    console.error("Private network transfer error:", error);

    let errorMessage = "Private network transfer failed";
    let statusCode = 500;

    if (axios.isAxiosError(error)) {
      if (error.response) {
        errorMessage = `Transfer API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`;
        statusCode =
          error.response.status >= 400 && error.response.status < 500
            ? 400
            : 500;
      } else if (error.request) {
        errorMessage = "Unable to connect to private network";
        statusCode = 503;
      }
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Execute private network token redemption
 * POST /api/daml/redemption
 */
router.post("/redemption", requireAuth, async (req: Request, res: Response) => {
  try {
    console.log("[DAML Redemption] Request user object:", (req as any).user);
    const userId = (req as any).user?.user_id;
    console.log(
      "[DAML Redemption] Extracted userId:",
      userId,
      "typeof:",
      typeof userId,
    );

    if (!userId) {
      console.log("[DAML Redemption] No userId found, returning 401");
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    const { amount, tokenType } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount is required and must be greater than 0",
      });
    }

    // Get full user object to fetch username and partyId
    console.log(
      "[DAML Redemption] Calling storage.getUser with userId:",
      userId,
    );
    const user = await storage.getUser(userId);
    console.log(
      "[DAML Redemption] Retrieved user from storage:",
      user ? "User found" : "User not found",
    );
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.username || !user.partyId) {
      return res.status(400).json({
        success: false,
        message:
          "User must have username and partyId configured for private network redemptions",
      });
    }
   

    // Step 2: Generate multi-party token
    const bankPartyId =
      "NewBank::1220b845dcf0d9cf52ce1e7457a744a6f3de7eff4a9ee95261b69405d1e0de8a768d";
    const tokenName = `${user.username}_bank_token`;
    const parties = [user.partyId, bankPartyId];

    const multipartToken = generateMultiPartyToken(tokenName, parties);
    console.log(
      `Generated multi-party token for redemption: ${multipartToken}`,
    );   

    const goldContractId = await getContractIdBySymbol("GLD");
      // Get silver contract ID
      const silverContractId = await getContractIdBySymbol("SLV");

      const contract = tokenType === "GOLD" ? goldContractId : silverContractId;
      console.log(`Gold contract ID: ${contract}`);
    

    const redemptionResponse = await axios.post(
      `${process.env.CANTON_API_BASE_URL}/exercise`,
      {
        templateId:
          "323be96aa0b9cd4a6f9cf17a5096b7a69c0cc2da28d31baa5e53c72f2c8ce9c1:TokenExample:AssetRegistry",
        contractId: contract,
        choice: "RequestRedemption",
        argument: {
          redeemer: user.partyId,
          amount: amount,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${multipartToken}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      },
    );

    console.log("Redemption completed successfully:", redemptionResponse.data);

    // Return success response with redemption details
    res.status(200).json({
      success: true,
      message: "Private network redemption request completed successfully",
      data: {
        transactionId:
          redemptionResponse.data?.result?.exerciseResult || "unknown",
        redeemer: user.partyId,
        amount: amount,
        contractId: contract,
        tokenName: tokenName,       
      },
    });
  } catch (error: any) {
    console.error("Private network redemption error:", error);

    let errorMessage = "Private network redemption failed";
    let statusCode = 500;

    if (axios.isAxiosError(error)) {
      if (error.response) {
        errorMessage = `Redemption API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`;
        statusCode =
          error.response.status >= 400 && error.response.status < 500
            ? 400
            : 500;
      } else if (error.request) {
        errorMessage = "Unable to connect to private network";
        statusCode = 503;
      }
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Cancel private network token redemption request
 * POST /api/daml/redemption/cancel
 */
router.post(
  "/redemption/cancel",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      console.log(
        "[DAML Redemption Cancel] Request user object:",
        (req as any).user,
      );
      const userId = (req as any).user?.user_id;
      console.log(
        "[DAML Redemption Cancel] Extracted userId:",
        userId,
        "typeof:",
        typeof userId,
      );

      if (!userId) {
        console.log("[DAML Redemption Cancel] No userId found, returning 401");
        return res.status(401).json({
          success: false,
          message: "User authentication required",
        });
      }

      const { contractId } = req.body;

      if (!contractId) {
        return res.status(400).json({
          success: false,
          message: "Contract ID is required",
        });
      }

      // Get full user object to fetch username and partyId
      console.log(
        "[DAML Redemption Cancel] Calling storage.getUser with userId:",
        userId,
      );
      const user = await storage.getUser(userId);
      console.log(
        "[DAML Redemption Cancel] Retrieved user from storage:",
        user ? "User found" : "User not found",
      );
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (!user.partyId) {
        return res.status(400).json({
          success: false,
          message: "User partyId not found. Please complete registration.",
        });
      }

      console.log("[DAML Redemption Cancel] User partyId found:", user.partyId);

      // Generate Canton JWT token for this user
      const cantonToken = await createUserToken(user.username!);
      console.log(
        "[DAML Redemption Cancel] Canton token generated successfully",
      );

      // Prepare the cancellation request payload
      const cancelPayload = {
        templateId:
          "323be96aa0b9cd4a6f9cf17a5096b7a69c0cc2da28d31baa5e53c72f2c8ce9c1:TokenExample:RedeemRequest",
        contractId: contractId,
        choice: "Cancel",
        argument: {},
      };

      console.log(
        "[DAML Redemption Cancel] Making cancellation request to private network...",
      );
      console.log(
        "[DAML Redemption Cancel] Payload:",
        JSON.stringify(cancelPayload, null, 2),
      );

      // Make the cancellation request to private network
      const response = await axios.post(
        `${process.env.CANTON_API_BASE_URL}/exercise`,
        cancelPayload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cantonToken}`,
          },
          timeout: 10000, // 10 second timeout
        },
      );

      console.log("[DAML Redemption Cancel] Success response:", response.data);

      // Return success response
      res.status(200).json({
        success: true,
        message: "Redemption request cancelled successfully",
        data: {
          contractId: contractId,
          cancelResponse: response.data,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      console.error("[DAML Redemption Cancel] Error occurred:", error);

      let errorMessage = "Failed to cancel redemption request";
      let statusCode = 500;

      if (error.response) {
        // API responded with error status
        console.error("[DAML Redemption Cancel] API Error Response:", {
          status: error.response.status,
          data: error.response.data,
        });
        errorMessage = `Cancellation API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`;
        statusCode =
          error.response.status >= 400 && error.response.status < 500
            ? 400
            : 500;
      } else if (error.request) {
        errorMessage = "Unable to connect to private network";
        statusCode = 503;
      }

      res.status(statusCode).json({
        success: false,
        message: errorMessage,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/**
 * Cancel redemption wrapper API - matches external API format
 * POST /api/daml/cancel-redemption
 */
router.post(
  "/cancel-redemption",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      console.log(
        "[Cancel Redemption Wrapper] Request user object:",
        (req as any).user,
      );
      const userId = (req as any).user?.user_id;
      console.log(
        "[Cancel Redemption Wrapper] Extracted userId:",
        userId,
        "typeof:",
        typeof userId,
      );

      if (!userId) {
        console.log("[Cancel Redemption Wrapper] No userId found, returning 401");
        return res.status(401).json({
          success: false,
          message: "User authentication required",
        });
      }

      const { contractId } = req.body;

      // Validate required fields
      if (!contractId) {
        return res.status(400).json({
          success: false,
          message: "templateId, contractId, and choice are required",
        });
      }

      // Get full user object to fetch username and partyId
      console.log(
        "[Cancel Redemption Wrapper] Calling storage.getUser with userId:",
        userId,
      );
      const user = await storage.getUser(userId);
      console.log(
        "[Cancel Redemption Wrapper] Retrieved user from storage:",
        user ? "User found" : "User not found",
      );
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (!user.partyId || !user.username) {
        return res.status(400).json({
          success: false,
          message: "User partyId and username not found. Please complete registration.",
        });
      }

      console.log("[Cancel Redemption Wrapper] User partyId found:", user.partyId);

      // Generate Canton JWT token for this user
      const cantonToken = createUserToken("bank_admin");
      console.log(
        "[Cancel Redemption Wrapper] Canton token generated successfully",
      );

      // Prepare the cancellation request payload (matching the curl format)
      const cancelPayload = {
        templateId: "323be96aa0b9cd4a6f9cf17a5096b7a69c0cc2da28d31baa5e53c72f2c8ce9c1:TokenExample:RedeemRequest",
        contractId,
        choice : "Cancel",
        argument: {},
      };

      console.log(
        "[Cancel Redemption Wrapper] Making cancellation request to private network...",
      );
      console.log(
        "[Cancel Redemption Wrapper] Payload:",
        JSON.stringify(cancelPayload, null, 2),
      );

      console.log("[Cancel Redemption Wrapper] Canton token:",cancelPayload)
      // Make the cancellation request to private network (same URL as in curl)
      const response = await axios.post(
        `${process.env.CANTON_API_BASE_URL}/exercise`,
        cancelPayload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cantonToken}`,
          },
          timeout: 10000, // 10 second timeout
        },
      );

      console.log("[Cancel Redemption Wrapper] Success response:", response.data);

      // Return success response
      res.status(200).json({
        success: true,
        message: "Redemption cancelled successfully",
        data: {         
          contractId,        
          response: response.data,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      console.error("[Cancel Redemption Wrapper] Error occurred:", error);

      let errorMessage = "Failed to cancel redemption";
      let statusCode = 500;

      if (error.response) {
        // API responded with error status
        console.error("[Cancel Redemption Wrapper] API Error Response:", {
          status: error.response.status,
          data: error.response.data,
        });
        errorMessage = `Cancellation API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`;
        statusCode =
          error.response.status >= 400 && error.response.status < 500
            ? 400
            : 500;
      } else if (error.request) {
        errorMessage = "Unable to connect to private network";
        statusCode = 503;
      }

      res.status(statusCode).json({
        success: false,
        message: errorMessage,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

export default router;
