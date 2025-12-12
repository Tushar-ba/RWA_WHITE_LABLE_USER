import axios from 'axios';
import { ContactFormData } from '../../shared/schema';
import { ENV } from '@shared/constants';

interface ZendeskTicketRequest {
  ticket: {
    subject: string;
    comment: {
      body: string;
    };
    requester: {
      name: string;
      email: string;
    };
    tags?: string[];
    priority?: 'low' | 'normal' | 'high' | 'urgent';
  };
}

interface ZendeskTicketResponse {
  ticket: {
    id: number;
    url: string;
    subject: string;
    status: string;
    created_at: string;
  };
}

export class ZendeskService {
  private baseUrl: string;
  private authHeader: string;

  constructor() {
    const subdomain = process.env.ZENDESK_SUBDOMAIN;
    const username = process.env.ZENDESK_USERNAME;
    const apiToken = process.env.ZENDESK_API_TOKEN;

    if (!subdomain || !username || !apiToken) {
      throw new Error('Missing required Zendesk environment variables');
    }

    this.baseUrl = `https://${subdomain}.zendesk.com/api/v2`;
    
    // Create base64 encoded auth string: username/token:api_token
    const credentials = `${username}/token:${apiToken}`;
    this.authHeader = `Basic ${Buffer.from(credentials).toString('base64')}`;
  }

  /**
   * Create a Zendesk ticket from contact form data
   */
  async createTicket(contactData: ContactFormData): Promise<{ success: boolean; ticketId?: number; message: string }> {
    try {
      const ticketRequest: ZendeskTicketRequest = {
        ticket: {
          subject: `Contact Form: ${contactData.subject}`,
          comment: {
            body: this.formatTicketBody(contactData)
          },
          requester: {
            name: `${contactData.firstName} ${contactData.lastName}`,
            email: contactData.email
          },
          tags: ['contact-form', 'vaulted-assets'],
          priority: 'normal'
        }
      };

      const response = await axios.post<ZendeskTicketResponse>(
        `${this.baseUrl}/tickets.json`,
        ticketRequest,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': this.authHeader
          },
          timeout: 10000 // 10 second timeout
        }
      );

      console.log(`[Zendesk] Ticket created successfully: ${response.data.ticket.id}`);
      
      return {
        success: true,
        ticketId: response.data.ticket.id,
        message: `Support ticket #${response.data.ticket.id} created successfully. We will get back to you soon!`
      };

    } catch (error) {
      console.error('[Zendesk] Error creating ticket:', error);
      
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const statusText = error.response?.statusText;
        const errorData = error.response?.data;
        
        console.error(`[Zendesk] HTTP ${status} ${statusText}:`, errorData);
        
        // Handle specific error cases
        if (status === 401) {
          return {
            success: false,
            message: 'Authentication failed. Please contact support.'
          };
        } else if (status === 422) {
          return {
            success: false,
            message: 'Invalid data provided. Please check your form and try again.'
          };
        } else if (status === 429) {
          return {
            success: false,
            message: 'Too many requests. Please try again later.'
          };
        }
      }

      return {
        success: false,
        message: 'Failed to create support ticket. Please try again later or contact us directly.'
      };
    }
  }

  /**
   * Format contact form data into ticket body
   */
  private formatTicketBody(contactData: ContactFormData): string {
    return `
Contact Form Submission from Solulab Assets Website

Name: ${contactData.firstName} ${contactData.lastName}
Email: ${contactData.email}
${contactData.company ? `Company: ${contactData.company}` : ''}
Subject: ${contactData.subject}

Message:
${contactData.message}

---
Submitted via Solulab Assets contact form on ${new Date().toLocaleString()}
    `.trim();
  }

  /**
   * Test Zendesk connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/tickets.json?per_page=1`, {
        headers: {
          'Authorization': this.authHeader
        },
        timeout: 5000
      });
      
      console.log('[Zendesk] Connection test successful');
      return response.status === 200;
    } catch (error) {
      console.error('[Zendesk] Connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const zendeskService = new ZendeskService();