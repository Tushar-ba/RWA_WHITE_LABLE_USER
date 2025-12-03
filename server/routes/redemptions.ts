import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireKycApproval } from "../middleware/kyc.middleware";
import { insertRedemptionSchema } from "@shared/schema";
import { z } from "zod";
import { Redemption } from "../models/Redemption.js";
import { User } from "../models/User.js";
import { Notification } from "../models/Notification.js";

const router = Router();

// GET /api/redemptions - List all redemptions for the user
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Parse pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Use Mongoose to find redemptions with user population
    const [redemptions, total] = await Promise.all([
      Redemption.find({ userId })
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Redemption.countDocuments({ userId }),
    ]);

    const totalPages = Math.ceil(total / limit);

    // Disable caching for redemption data to ensure fresh data
    res.set({
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });

    res.status(200).json({
      success: true,
      message: "Redemptions retrieved successfully",
      redemptions: redemptions.map((redemption: any) => ({
        _id: redemption._id,
        id: redemption._id, // Keep both for compatibility
        token: redemption.token,
        quantity: redemption.quantity,
        gramsAmount: redemption.gramsAmount,
        tokenValueUSD: redemption.tokenValueUSD,
        network: redemption.network,
        deliveryAddress: redemption.deliveryAddress,
        status: redemption.status,
        requestId: redemption.requestId,
        transactionHash: redemption.transactionHash,
        errorMessage: redemption.errorMessage,
        deliveryFee: redemption.deliveryFee,
        totalCostUSD: redemption.totalCostUSD,
        walletAddress: redemption.walletAddress,
        user_info: redemption.userId || null,
        createdAt: redemption.createdAt,
        updatedAt: redemption.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching redemptions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch redemptions",
    });
  }
});

// Create a new redemption request or update existing one if transactionHash exists (for blockchain integration)
router.post(
  "/",
  requireAuth,
  requireKycApproval,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.user_id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      // Get user info using Mongoose
      const userInfo = await User.findById(userId).lean();
      if (!userInfo) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Validate minimal payload with expanded user data and wallet address
      const requestData = {
        ...req.body,
        network:
          req.body.network === "Ethereum"
            ? "public"
            : req.body.network.toLowerCase(),
        token: req.body.token.toLowerCase(),
        userId: userId,
        walletAddress: req.body.walletAddress,
        status: req.body.status || "pending",
      };

      // CRITICAL: Remove any 'id' field before validation to prevent E11000 error
      delete (requestData as any).id;

      const validatedData = insertRedemptionSchema.parse(requestData);

      let redemption;
      let isUpdate = false;

      // Use findOneAndUpdate with upsert to handle create/update
      if (validatedData.transactionHash) {
        redemption = await Redemption.findOneAndUpdate(
          { transactionHash: validatedData.transactionHash },
          {
            $set: {
              userId,
              token: validatedData.token,
              quantity: validatedData.quantity,
              gramsAmount: validatedData.gramsAmount,
              tokenValueUSD: validatedData.tokenValueUSD,
              network: validatedData.network,
              deliveryAddress: validatedData.deliveryAddress,
              streetAddress: validatedData.streetAddress,
              city: validatedData.city,
              state: validatedData.state,
              zipCode: validatedData.zipCode,
              country: validatedData.country,
              status: validatedData.status,
              requestId: validatedData.requestId,
              errorMessage: validatedData.errorMessage,
              deliveryFee: validatedData.deliveryFee,
              totalCostUSD: validatedData.totalCostUSD,
              currentTokenPrice: validatedData.currentTokenPrice,
              walletAddress: validatedData.walletAddress,
            },
          },
          {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
          },
        );

        // Check if this was an update by looking for existing document
        const existingRedemption = await Redemption.findOne({
          transactionHash: validatedData.transactionHash,
        }).lean();
        isUpdate =
          !!existingRedemption &&
          existingRedemption.createdAt < redemption.createdAt;
      } else {
        // Create new record (no transactionHash provided)
        redemption = await Redemption.create({ ...validatedData, userId });
      }

      if (!redemption) {
        return res.status(500).json({
          success: false,
          message: "Failed to process redemption request",
        });
      }

      // Create notification for SUPPLY_CONTROLLER_ROLE on successful redemption (using Mongoose)
      try {
        if (
          redemption &&
          (redemption.status === "pending" ||
            redemption.status === "approved") &&
          !isUpdate
        ) {
          console.log(
            "🔍 Creating notification for redemption:",
            redemption._id,
            "Status:",
            redemption.status,
            "IsUpdate:",
            isUpdate,
          );

          const notification = new Notification({
            type: "redemption",
            title: `New Redemption Request - ${redemption.token}`,
            message: `User ${userInfo.first_name || userInfo.last_name || "User"} has requested redemption of ${redemption.quantity} ${redemption.token} tokens via ${redemption.network} network. Delivery to: ${redemption.city}, ${redemption.state}, ${redemption.country}`,
            relatedId: redemption._id?.toString(),
            priority: "high",
            targetRoles: ["SUPPLY_CONTROLLER_ROLE"],
            isRead: false,
          });

          await notification.save();
          console.log(
            "✅ Notification created for redemption request:",
            redemption._id,
          );
        } else {
          console.log(
            "🔍 Skipping notification - redemption:",
            redemption?._id,
            "status:",
            redemption?.status,
            "isUpdate:",
            isUpdate,
          );
        }
      } catch (notificationError) {
        console.error(
          "⚠️ Failed to create redemption notification (non-blocking):",
          notificationError,
        );
        // Don't fail the API call if notification creation fails
      }

      res.status(isUpdate ? 200 : 201).json({
        success: true,
        message: isUpdate
          ? "Redemption request updated successfully"
          : "Redemption request created successfully",
        redemption: {
          _id: redemption._id,
          transactionHash: redemption.transactionHash,
          status: redemption.status,
          createdAt: redemption.createdAt,
        },
      });
    } catch (error) {
      console.error(
        "[REDEMPTION-API] Error creating/updating redemption:",
        error,
      );
      console.error("[REDEMPTION-API] Request body:", req.body);
      console.error("[REDEMPTION-API] User ID:", (req as any).user?.user_id);
      console.error("[REDEMPTION-API] Error stack:", (error as Error).stack);

      if (error instanceof z.ZodError) {
        console.error("[REDEMPTION-API] Validation errors:", error.errors);
        return res.status(400).json({
          success: false,
          message: "Invalid redemption data",
          errors: error.errors,
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to create/update redemption request",
        debug:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      });
    }
  },
);

// Legacy endpoint for full redemption creation
router.post(
  "/create",
  requireAuth,
  requireKycApproval,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.user_id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      // Validate the request body
      const validatedData = insertRedemptionSchema.parse({
        ...req.body,
        userId,
      });

      // Get user info for notification using Mongoose
      const userInfo = await User.findById(userId).lean();

      // Create the redemption in the database using Mongoose
      const redemption = await Redemption.create({ ...validatedData, userId });

      // Create notification for SUPPLY_CONTROLLER_ROLE on successful redemption (legacy endpoint)
      try {
        if (
          redemption &&
          userInfo &&
          (redemption.status === "pending" || redemption.status === "approved")
        ) {
          const notification = new Notification({
            type: "redemption",
            title: `New Redemption Request - ${redemption.token}`,
            message: `User ${userInfo.first_name || userInfo.last_name || "User"} has requested redemption of ${redemption.quantity} ${redemption.token} tokens via ${redemption.network} network. Delivery to: ${redemption.city}, ${redemption.state}, ${redemption.country}`,
            relatedId: redemption._id?.toString(),
            priority: "high",
            targetRoles: ["SUPPLY_CONTROLLER_ROLE"],
            isRead: false,
          });

          await notification.save();
          console.log(
            "✅ Notification created for redemption request (legacy endpoint):",
            redemption._id,
          );
        }
      } catch (notificationError) {
        console.error(
          "⚠️ Failed to create redemption notification (non-blocking):",
          notificationError,
        );
        // Don't fail the API call if notification creation fails
      }

      res.status(201).json({
        success: true,
        message: "Redemption request created successfully",
        redemption: {
          _id: redemption._id,
          token: redemption.token,
          quantity: redemption.quantity,
          status: redemption.status,
          createdAt: redemption.createdAt,
        },
      });
    } catch (error) {
      console.error("Error creating redemption:", error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.errors,
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to create redemption request",
      });
    }
  },
);

// Get redemption history for the authenticated user with pagination
router.get("/history", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Parse pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Use Mongoose to find redemptions with user population
    const [redemptions, total] = await Promise.all([
      Redemption.find({ userId })
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Redemption.countDocuments({ userId }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      message: "Redemption history retrieved successfully",
      redemptions: redemptions.map((redemption: any) => ({
        _id: redemption._id,
        id: redemption._id, // Keep both for compatibility
        token: redemption.token,
        quantity: redemption.quantity,
        gramsAmount: redemption.gramsAmount,
        tokenValueUSD: redemption.tokenValueUSD,
        network: redemption.network,
        deliveryAddress: redemption.deliveryAddress,
        status: redemption.status,
        requestId: redemption.requestId,
        transactionHash: redemption.transactionHash,
        errorMessage: redemption.errorMessage,
        deliveryFee: redemption.deliveryFee,
        totalCostUSD: redemption.totalCostUSD,
        walletAddress: redemption.walletAddress,
        user_info: redemption.userId || null,
        createdAt: redemption.createdAt,
        updatedAt: redemption.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching redemption history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch redemption history",
    });
  }
});

// Get a specific redemption by ID
router.get("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const { id } = req.params;
    const redemption = await Redemption.findById(id)
      .populate("userId", "name email")
      .lean();

    if (!redemption) {
      return res.status(404).json({
        success: false,
        message: "Redemption not found",
      });
    }

    // Ensure user can only access their own redemptions
    const redemptionUserId =
      typeof redemption.userId === "string"
        ? redemption.userId
        : redemption.userId._id?.toString() || redemption.userId.toString();

    if (redemptionUserId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.status(200).json({
      success: true,
      message: "Redemption retrieved successfully",
      redemption,
    });
  } catch (error) {
    console.error("Error fetching redemption:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch redemption",
    });
  }
});

// DELETE /api/redemptions/:id - Cancel a redemption request
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const redemptionId = req.params.id;
    const { walletAddress } = req.body; // Get wallet address from request body

    // Get the redemption to check ownership and status using Mongoose
    const redemption = await Redemption.findById(redemptionId).lean();

    if (!redemption) {
      return res.status(404).json({
        success: false,
        message: "Redemption not found",
      });
    }

    // Check if the redemption belongs to the current user
    const redemptionUserId =
      typeof redemption.userId === "string"
        ? redemption.userId
        : redemption.userId._id?.toString() || redemption.userId.toString();

    if (redemptionUserId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Check if wallet address is provided and matches
    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        message: "Wallet address is required to cancel redemption",
      });
    }

    if (redemption.walletAddress !== walletAddress) {
      return res.status(403).json({
        success: false,
        message:
          "Connect to the correct wallet address to cancel this redemption request",
      });
    }

    // Check if the redemption can be cancelled (only pending status can be cancelled)
    if (redemption.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel redemption with status: ${redemption.status}. Only pending redemptions can be cancelled.`,
      });
    }

    // Update the redemption status to cancelled using findOneAndUpdate
    const updatedRedemption = await Redemption.findOneAndUpdate(
      { _id: redemptionId },
      { $set: { status: "cancelled" } },
      { new: true },
    );

    if (!updatedRedemption) {
      return res.status(500).json({
        success: false,
        message: "Failed to cancel redemption",
      });
    }

    res.status(200).json({
      success: true,
      message: "Redemption cancelled successfully",
      redemption: {
        _id: updatedRedemption._id,
        status: updatedRedemption.status,
        updatedAt: updatedRedemption.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error cancelling redemption:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Update redemption status (PUT endpoint for status updates)
router.put("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const redemptionId = req.params.id;
    const updateData = req.body;

    // Get the redemption to check ownership using Mongoose
    const redemption = await Redemption.findById(redemptionId).lean();

    if (!redemption) {
      return res.status(404).json({
        success: false,
        message: "Redemption not found",
      });
    }

    // Check if the redemption belongs to the current user
    const redemptionUserId =
      typeof redemption.userId === "string"
        ? redemption.userId
        : redemption.userId._id?.toString() || redemption.userId.toString();

    if (redemptionUserId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Update the redemption using findOneAndUpdate
    const updatedRedemption = await Redemption.findOneAndUpdate(
      { _id: redemptionId },
      { $set: updateData },
      { new: true },
    );

    if (!updatedRedemption) {
      return res.status(500).json({
        success: false,
        message: "Failed to update redemption",
      });
    }

    res.status(200).json({
      success: true,
      message: "Redemption updated successfully",
      redemption: updatedRedemption,
    });
  } catch (error) {
    console.error("Error updating redemption:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;
