import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { NotificationService } from '../services/notification.service.js';

const router = Router();

/**
 * Get notifications for SUPPLY_CONTROLLER_ROLE
 * GET /api/notifications?page=1&limit=20
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    // Parse pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    // For now, we'll get notifications for SUPPLY_CONTROLLER_ROLE
    // In a real system, you'd check the user's roles from the JWT or database
    const roles = ['SUPPLY_CONTROLLER_ROLE'];
    
    const { notifications, total } = await NotificationService.getNotificationsByRole(roles, page, limit);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      message: 'Notifications retrieved successfully',
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve notifications',
      error: (error as Error).message
    });
  }
});

/**
 * Mark notification as read
 * PATCH /api/notifications/:id/read
 */
router.patch('/:id/read', requireAuth, async (req: Request, res: Response) => {
  try {
    const notificationId = req.params.id;
    
    const notification = await NotificationService.markAsRead(notificationId);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });

  } catch (error) {
    console.error('Mark notification as read error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: (error as Error).message
    });
  }
});

export default router;