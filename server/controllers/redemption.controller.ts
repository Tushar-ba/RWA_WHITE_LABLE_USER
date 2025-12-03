import { Request, Response } from 'express';
import { storage } from '../storage/index.js';
import { z } from 'zod';

const cancelRedemptionSchema = z.object({
  redemptionId: z.string().min(1, 'Redemption ID is required'),
  reason: z.string().optional()
});

export class RedemptionController {
  /**
   * Cancel a redemption request
   */
  static async cancelRedemption(req: Request, res: Response): Promise<void> {
    try {
      const { redemptionId, reason } = cancelRedemptionSchema.parse(req.body);
      const userId = req.session?.userId;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Get the redemption to verify ownership
      const redemption = await storage.getRedemptionById(redemptionId);
      
      if (!redemption) {
        res.status(404).json({ error: 'Redemption not found' });
        return;
      }

      // Verify ownership
      if (redemption.userId.toString() !== userId) {
        res.status(403).json({ error: 'Not authorized to cancel this redemption' });
        return;
      }

      // Check if redemption can be cancelled
      if (!['pending', 'processing'].includes(redemption.status)) {
        res.status(400).json({ 
          error: `Cannot cancel redemption with status: ${redemption.status}` 
        });
        return;
      }

      // Update redemption status
      await storage.updateRedemption(redemptionId, {
        status: 'cancelled',
        cancellationReason: reason || 'Cancelled by user',
        cancelledAt: new Date(),
        updatedAt: new Date()
      });

      res.json({
        message: 'Redemption cancelled successfully',
        redemptionId
      });

    } catch (error) {
      console.error('Error cancelling redemption:', error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: 'Validation error', 
          details: error.errors 
        });
        return;
      }

      res.status(500).json({ 
        error: 'Failed to cancel redemption' 
      });
    }
  }

  /**
   * Get redemptions for current user
   */
  static async getUserRedemptions(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.session?.userId;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const redemptions = await storage.getRedemptionsByUserId(userId);

      res.json({
        message: 'Redemptions retrieved successfully',
        redemptions
      });

    } catch (error) {
      console.error('Error getting user redemptions:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve redemptions' 
      });
    }
  }

  /**
   * Get specific redemption by ID
   */
  static async getRedemption(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.session?.userId;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const redemption = await storage.getRedemptionById(id);
      
      if (!redemption) {
        res.status(404).json({ error: 'Redemption not found' });
        return;
      }

      // Verify ownership
      if (redemption.userId.toString() !== userId) {
        res.status(403).json({ error: 'Not authorized to view this redemption' });
        return;
      }

      res.json({
        message: 'Redemption retrieved successfully',
        redemption
      });

    } catch (error) {
      console.error('Error getting redemption:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve redemption' 
      });
    }
  }
}