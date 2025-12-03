import { Router, Request, Response } from "express";
import { storage } from "../storage/index.js";

const router = Router();

/**
 * Get platform fee settings
 * GET /api/system/platform-fee
 */
router.get("/platform-fee", async (req: Request, res: Response) => {
  try {
    console.log('[System API] Fetching platform fee settings...');
    
    // Fetch platform fee by the specific ID from the image
    const platformFeeSetting = await storage.getSystemSettingById('68a4728acaed18bf15f96f26');
    
    if (!platformFeeSetting) {
      console.log('[System API] Platform fee setting not found');
      return res.status(404).json({
        success: false,
        message: "Platform fee setting not found",
      });
    }

    console.log('[System API] Platform fee setting found:', platformFeeSetting);

    // Extract percentage from the value object
    const percentage = platformFeeSetting.value?.percentage;
    
    if (percentage === undefined || percentage === null) {
      console.log('[System API] Platform fee percentage not found in value object');
      return res.status(404).json({
        success: false,
        message: "Platform fee percentage not configured",
      });
    }

    res.status(200).json({
      success: true,
      message: "Platform fee retrieved successfully",
      data: {
        id: platformFeeSetting._id,
        key: platformFeeSetting.key,
        percentage: percentage,
        value: platformFeeSetting.value,
        updatedAt: platformFeeSetting.updatedAt,
        updatedBy: platformFeeSetting.updatedBy
      },
    });

  } catch (error: any) {
    console.error("[System API] Error fetching platform fee:", error);
    
    res.status(500).json({
      success: false,
      message: "Failed to fetch platform fee",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Get platform fee by key (alternative endpoint)
 * GET /api/system/platform-fee-by-key
 */
router.get("/platform-fee-by-key", async (req: Request, res: Response) => {
  try {
    console.log('[System API] Fetching platform fee by key...');
    
    // Fetch platform fee by key
    const platformFeeSetting = await storage.getSystemSettingByKey('platform_fee');
    
    if (!platformFeeSetting) {
      console.log('[System API] Platform fee setting not found by key');
      return res.status(404).json({
        success: false,
        message: "Platform fee setting not found",
      });
    }

    console.log('[System API] Platform fee setting found by key:', platformFeeSetting);

    // Extract percentage from the value object
    const percentage = platformFeeSetting.value?.percentage;
    
    if (percentage === undefined || percentage === null) {
      console.log('[System API] Platform fee percentage not found in value object');
      return res.status(404).json({
        success: false,
        message: "Platform fee percentage not configured",
      });
    }

    res.status(200).json({
      success: true,
      message: "Platform fee retrieved successfully",
      data: {
        id: platformFeeSetting._id,
        key: platformFeeSetting.key,
        percentage: percentage,
        value: platformFeeSetting.value,
        updatedAt: platformFeeSetting.updatedAt,
        updatedBy: platformFeeSetting.updatedBy
      },
    });

  } catch (error: any) {
    console.error("[System API] Error fetching platform fee by key:", error);
    
    res.status(500).json({
      success: false,
      message: "Failed to fetch platform fee",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @route GET /api/system/token-conversion
 * @description Get dynamic token conversion values from environment variables
 */
router.get("/token-conversion", async (req: Request, res: Response) => {
  try {
    console.log('[System API] Fetching token conversion values...');
    
    // Get token conversion values from environment variables
    const goldMgPerToken = parseInt(process.env.GOLD_MG_PER_TOKEN || '10');
    const silverMgPerToken = parseInt(process.env.SILVER_MG_PER_TOKEN || '10');
    
    console.log('[System API] Token conversion values:', {
      goldMgPerToken,
      silverMgPerToken
    });

    res.status(200).json({
      success: true,
      message: "Token conversion values retrieved successfully",
      data: {
        gold: {
          mgPerToken: goldMgPerToken,
          displayText: `${goldMgPerToken}mg of gold`
        },
        silver: {
          mgPerToken: silverMgPerToken,
          displayText: `${silverMgPerToken}mg of silver`
        }
      },
    });

  } catch (error: any) {
    console.error('[System API] Error fetching token conversion values:', error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve token conversion values",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;