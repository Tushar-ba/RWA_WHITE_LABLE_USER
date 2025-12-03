import { Request, Response } from 'express';
import { zendeskService } from '../services/zendesk.service';
import { ContactFormData } from '../../shared/schema';

export class ContactController {
  /**
   * Handle contact form submission by creating a Zendesk ticket
   */
  static async submitContactForm(req: Request, res: Response): Promise<void> {
    try {
      const contactData: ContactFormData = req.body;
      
      console.log(`[Contact] Processing contact form submission from: ${contactData.email}`);
      
      // Create Zendesk ticket
      const result = await zendeskService.createTicket(contactData);
      
      if (result.success) {
        console.log(`[Contact] Successfully created Zendesk ticket: ${result.ticketId}`);
        res.status(200).json({
          success: true,
          message: result.message,
          ticketId: result.ticketId
        });
      } else {
        console.error('[Contact] Failed to create Zendesk ticket:', result.message);
        res.status(500).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('[Contact] Contact form submission error:', error);
      res.status(500).json({
        success: false,
        message: 'An unexpected error occurred while processing your request. Please try again later.'
      });
    }
  }
}