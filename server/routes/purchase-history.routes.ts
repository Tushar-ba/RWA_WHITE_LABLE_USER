import { Router } from "express";
import {
  requireAuth,
  AuthenticatedRequest,
} from "../middleware/auth.middleware.js";
import { storage } from "../storage/index.js";
import { Logger } from "../utils/logger.js";

const router = Router();

/**
 * @route GET /api/purchase-history
 * @description Get user's purchase history with pagination
 * @query {page, limit}
 * @auth Required
 */
router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = (req as AuthenticatedRequest).user?.user_id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // OPTIMIZED: Single query with user and wallet population
    const { purchases, total } = await (
      storage as any
    ).getPurchaseHistoryWithDetailsePaginated(userId, skip, limit);

    Logger.info(
      `Retrieved ${purchases.length} purchase history records for user ${userId}`,
    );

    // Disable caching for purchase history data to ensure fresh data
    res.set({
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });

    res.json({
      success: true,
      message: "Purchase history retrieved successfully",
      data: {
        purchases,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    Logger.error("Error retrieving purchase history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve purchase history",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @route POST /api/purchase-history
 * @description Create a new purchase history record (updated for OnRamper integration)
 * @body {metal, tokenAmount, usdAmount, feeAmount, date, time, status, networkType, paymentMethod, walletAddress, transactionHash?, errorMessage?, useOnRamper?}
 * @auth Required
 */
router.post("/", requireAuth, async (req, res) => {
  try {
    const userId = (req as AuthenticatedRequest).user?.user_id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // REQUIRED: Use findOne with populate instead of separate getUserInfo query
    const userInfo = await storage.getUserInfo(userId);
    if (!userInfo) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Extract OnRamper flag from request body
    const { useOnRamper, ...purchaseData } = req.body;

    // For OnRamper payments, start with initiated status, moves to pending when payment starts
    if (useOnRamper && purchaseData.paymentMethod === "fiat") {
      purchaseData.status = "initiated";
      Logger.info(
        `Creating OnRamper-enabled purchase for user ${userId} with initiated status`,
      );
    }

    const purchase = await storage.createPurchaseHistory({
      userId: userInfo,
      ...purchaseData,
    });

    Logger.info(`Created purchase history record for user ${userId}:`, {
      purchaseId: purchase._id,
      metal: purchase.metal,
      amount: purchase.usdAmount,
      status: purchase.status,
      useOnRamper: useOnRamper || false,
    });

    // Create notification for SUPPLY_CONTROLLER_ROLE on successful token purchase
    try {
      const userInfo = await storage.getUserInfo(userId);
      if (userInfo && purchase) {
        // Use existing database connection from storage
        const notification = {
          type: "buyToken",
          title: `New Token Purchase - ${purchase.metal?.toUpperCase()}`,
          message: `User ${userInfo.name || "User"} has purchased ${purchase.tokenAmount} ${purchase.metal?.toUpperCase()} tokens for $${purchase.usdAmount} via ${purchase.networkType} network.`,
          relatedId: purchase._id?.toString(),
          priority: "normal",
          targetRoles: ["SUPPLY_CONTROLLER_ROLE", "DEFAULT_ADMIN_ROLE"],
          isRead: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await (storage as any).db
          .collection("notifications")
          .insertOne(notification);
        console.log(
          "✅ Notification created for token purchase:",
          purchase._id,
        );
      }
    } catch (notificationError) {
      console.error(
        "⚠️ Failed to create purchase notification (non-blocking):",
        notificationError,
      );
      // Don't fail the API call if notification creation fails
    }
    res.status(201).json({
      success: true,
      message: "Purchase history record created successfully",
      data: {
        ...purchase,
        useOnRamper: useOnRamper || false,
      },
    });
  } catch (error) {
    Logger.error("Error creating purchase history record:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create purchase history record",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @route PATCH /api/purchase-history/:id
 * @description Update a purchase history record
 * @param {id} - Purchase history record ID
 * @body Partial purchase history data
 * @auth Required
 */
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req as AuthenticatedRequest).user?.user_id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    Logger.info(`Attempting to update purchase history record: ${id} for user: ${userId}`, {
      updateData: req.body,
      requestId: id,
      userId
    });

    // Validate that the ID is a valid ObjectId
    const { ObjectId } = await import('mongodb');
    if (!ObjectId.isValid(id)) {
      Logger.warn(`Invalid purchase history ID format: ${id}`);
      return res.status(400).json({
        success: false,
        message: "Invalid purchase record ID format",
      });
    }

    const updatedPurchase = await storage.updatePurchaseHistory(id, req.body);

    if (!updatedPurchase) {
      Logger.warn(`Purchase history record not found: ${id} for user: ${userId}`);
      return res.status(404).json({
        success: false,
        message: "Purchase history record not found",
      });
    }

    Logger.info(`✅ Updated purchase history record ${id} for user ${userId}`, {
      updatedFields: Object.keys(req.body),
      status: updatedPurchase.status
    });

    res.json({
      success: true,
      message: "Purchase history record updated successfully",
      data: updatedPurchase,
    });
  } catch (error) {
    Logger.error("Error updating purchase history record:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update purchase history record",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @route GET /api/purchase-history/platform
 * @description Get last 10 platform purchases from all users (no user filtering)
 * @auth Not required (platform-wide data)
 */
router.get("/platform", async (req, res) => {
  try {
    // Get last 10 purchases across all users, ordered by creation date
    const purchases = await storage.getPlatformPurchases(10);

    Logger.info(`Retrieved ${purchases.length} platform purchase records`);

    // Disable caching for platform purchase data to ensure fresh data
    res.set({
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });

    res.json({
      success: true,
      message: "Platform purchases retrieved successfully",
      data: {
        purchases,
      },
    });
  } catch (error) {
    Logger.error("Error retrieving platform purchases:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve platform purchases",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export { router as purchaseHistoryRoutes };
