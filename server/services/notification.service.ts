import { Notification, INotification } from '../models/Notification';

export class NotificationService {
  /**
   * Create a notification for token purchase/minting events
   */
  static async createBuyTokenNotification(
    purchaseData: any,
    userInfo: any
  ): Promise<INotification> {
    const notification = new Notification({
      type: 'buyToken',
      title: `New Token Purchase - ${purchaseData.metal?.toUpperCase()}`,
      message: `User ${userInfo.firstName || userInfo.first_name || userInfo.name} has purchased ${purchaseData.tokenAmount} ${purchaseData.metal?.toUpperCase()} tokens for $${purchaseData.usdAmount} via ${purchaseData.networkType} network.`,
      relatedId: purchaseData._id?.toString(),
      priority: 'normal',
      targetRoles: ['SUPPLY_CONTROLLER_ROLE'],
      isRead: false
    });

    return await notification.save();
  }

  /**
   * Create a notification for gifting/buyToken events
   */
  static async createGiftingNotification(
    giftingData: any,
    userInfo: any
  ): Promise<INotification> {
    const notification = new Notification({
      type: 'buyToken',
      title: `New Token Purchase - ${giftingData.token}`,
      message: `User ${userInfo.first_name || userInfo.name} has purchased ${giftingData.quantity} ${giftingData.token} tokens (${giftingData.gramsAmount}g) via ${giftingData.network} network. Total value: $${giftingData.tokenValueUSD}`,
      relatedId: giftingData._id?.toString() || giftingData.transactionHash,
      priority: 'normal',
      targetRoles: ['SUPPLY_CONTROLLER_ROLE'],
      isRead: false
    });

    return await notification.save();
  }

  /**
   * Create a notification for redemption events
   */
  static async createRedemptionNotification(
    redemptionData: any,
    userInfo: any
  ): Promise<INotification> {
    const notification = new Notification({
      type: 'redemption',
      title: `New Redemption Request - ${redemptionData.token}`,
      message: `User ${userInfo.first_name || userInfo.name} has requested redemption of ${redemptionData.quantity} ${redemptionData.token} tokens (${redemptionData.gramsAmount}g) via ${redemptionData.network} network. Delivery to: ${redemptionData.city}, ${redemptionData.state}, ${redemptionData.country}`,
      relatedId: redemptionData._id?.toString() || redemptionData.transactionHash,
      priority: 'high',
      targetRoles: ['SUPPLY_CONTROLLER_ROLE'],
      isRead: false
    });

    return await notification.save();
  }

  /**
   * Get notifications for specific roles
   */
  static async getNotificationsByRole(
    roles: string[],
    page: number = 1,
    limit: number = 20
  ): Promise<{ notifications: INotification[]; total: number }> {
    const skip = (page - 1) * limit;
    
    const [notifications, total] = await Promise.all([
      Notification.find({
        targetRoles: { $in: roles }
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments({
        targetRoles: { $in: roles }
      })
    ]);

    return { notifications: notifications as INotification[], total };
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<INotification | null> {
    return await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );
  }
}