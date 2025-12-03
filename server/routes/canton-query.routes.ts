import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { storage } from '../storage/index.js';
import { createUserToken } from '../utils/canton.utils.js';
import axios from 'axios';

const router = Router();

/**
 * Canton Query Wrapper API
 * POST /api/canton/query
 * 
 * This endpoint wraps the Canton query API with automatic authentication:
 * 1. Extracts user from JWT token
 * 2. Fetches user's username and partyId from database
 * 3. Generates Canton JWT token using username
 * 4. Makes query with user's partyId as owner
 */
router.post('/query', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.user_id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User authentication required'
    });
  }

  // Get user details from database
  const user = await storage.getUser(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (!user.username || !user.partyId) {
    return res.status(400).json({
      success: false,
      message: 'User must have username and partyId configured for Canton queries'
    });
  }

  // Extract query parameters from request body (templateIds is optional, defaults to Token template)
  const { templateIds, query: queryParams } = req.body;

  // Use the fixed templateId for Token contracts
  const finalTemplateIds = templateIds || ["323be96aa0b9cd4a6f9cf17a5096b7a69c0cc2da28d31baa5e53c72f2c8ce9c1:TokenExample:Token"];

  if (!Array.isArray(finalTemplateIds)) {
    return res.status(400).json({
      success: false,
      message: 'templateIds must be an array'
    });
  }

  // Generate Canton token using user's username
  const cantonToken = createUserToken(user.username);

  // Prepare query payload with user's partyId as owner
  const queryPayload = {
    templateIds: finalTemplateIds,
    query: {
      ...queryParams,
      owner: user.partyId // Override owner with user's partyId
    }
  };

  try {
    console.log(`[Canton Query] Making query for user: ${user.username} (${user.partyId})`);
    console.log(`[Canton Query] Query payload:`, JSON.stringify(queryPayload, null, 2));

    // Make request to Canton API
    const response = await axios.post(
      `${process.env.CANTON_API_BASE_URL}/query`,
      queryPayload,
      {
        headers: {
          'Authorization': `Bearer ${cantonToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log(`[Canton Query] Response status: ${response.status}`);
    console.log(`[Canton Query] Response data:`, JSON.stringify(response.data, null, 2));

    // Return the response from Canton API
    res.status(200).json({
      success: true,
      message: 'Canton query executed successfully',
      data: response.data
    });

  } catch (error: any) {
    console.error('[Canton Query] Error:', error.message);
    
    if (error.response) {
      console.error('[Canton Query] Error response:', error.response.data);
      return res.status(error.response.status || 500).json({
        success: false,
        message: 'Canton query failed',
        error: error.response.data || error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error during Canton query',
      error: error.message
    });
  }
}));

export default router;