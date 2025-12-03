# OnRamper Integration Setup Guide

This guide will help you set up OnRamper for fiat and crypto payment processing in your Vaulted Assets platform.

## 1. OnRamper Account Setup

### Contact OnRamper Sales Team
1. Visit [OnRamper](https://onramper.com) and contact their sales team
2. Request API access for your business
3. Provide the following information:
   - Business name: Vaulted Assets
   - Use case: Precious metals tokenization platform
   - Expected volume: [Your expected monthly volume]
   - Required currencies: USD (fiat) → GOLD/SILVER tokens

### Obtain API Credentials
You will receive:
- **API Key**: Used for authenticating requests to OnRamper API
- **Webhook Secret**: Used for validating webhook payloads

## 2. Environment Variables Configuration

Add the following environment variables to your server:

```bash
# OnRamper Configuration
ONRAMPER_API_KEY=your_onramper_api_key_here
ONRAMPER_WEBHOOK_SECRET=your_webhook_secret_here
BASE_URL=https://yourdomain.com  # Your application's base URL for webhook callbacks
```

## 3. Webhook Configuration

### Webhook URL
Configure the following webhook URL in your OnRamper dashboard:
```
https://yourdomain.com/api/onramper/webhook
```

### Webhook Events
Enable the following webhook events:
- Transaction status updates
- Payment completion
- Payment failures
- Refund notifications

### Webhook Security
The webhook endpoint automatically validates signatures using your `ONRAMPER_WEBHOOK_SECRET`.

## 4. Supported Payment Methods

OnRamper supports various payment methods including:

### Fiat Payment Methods
- Credit/Debit Cards
- Bank Transfers
- Apple Pay
- Google Pay
- SEPA transfers (EU)
- ACH transfers (US)

### Crypto Payment Methods
- Bitcoin (BTC)
- Ethereum (ETH)
- USDC
- USDT
- Other major cryptocurrencies

## 5. Integration Flow

### Frontend Flow
1. User selects "Pay with Fiat" option
2. User enters purchase amount and selects metal type
3. System creates a pending purchase record
4. OnRamper payment component displays available quotes
5. User selects payment method and is redirected to OnRamper checkout
6. User completes payment on OnRamper's secure platform

### Backend Flow
1. Purchase record created with `status: 'pending'`
2. OnRamper transaction created with metadata
3. User redirected to OnRamper checkout
4. Webhook receives payment status updates
5. Purchase record updated based on payment status
6. User notified of payment result

## 6. Status Mapping

OnRamper statuses are mapped to our purchase statuses as follows:

| OnRamper Status | Our Status | Description |
|-----------------|------------|-------------|
| `pending` | `pending` | Payment initiated |
| `waitingPayment` | `pending` | Waiting for user payment |
| `paid` | `processing` | Payment received, processing |
| `completed` | `completed` | Transaction successful |
| `failed` | `failed` | Payment failed |
| `cancelled` | `failed` | User cancelled payment |

## 7. Testing

### Development Mode
1. Use OnRamper's staging environment for testing
2. Configure staging API keys in development environment
3. Test webhook delivery using tools like ngrok for local development

### Test Scenarios
- Successful fiat payment
- Failed payment
- Cancelled payment
- Webhook delivery
- Status updates

## 8. Production Deployment

### Security Checklist
- [ ] API keys stored securely in environment variables
- [ ] Webhook signature validation enabled
- [ ] HTTPS enabled for webhook endpoints
- [ ] Error handling implemented for failed payments
- [ ] Logging configured for audit trails

### Monitoring
- Monitor webhook delivery success rates
- Track payment conversion rates
- Set up alerts for failed payments
- Monitor OnRamper API response times

## 9. API Endpoints

The following API endpoints have been implemented:

### For Frontend
- `GET /api/onramper/quotes` - Get payment quotes
- `GET /api/onramper/payment-types` - Get supported payment methods
- `GET /api/onramper/defaults` - Get default currencies and amounts
- `POST /api/onramper/create-transaction` - Create OnRamper transaction

### For Webhooks
- `POST /api/onramper/webhook` - Receive OnRamper status updates

## 10. Customer Support

### Payment Issues
- Failed payments are automatically logged with error details
- Purchase history shows detailed payment status
- Users receive clear error messages for failed payments

### Refunds
- Refunds are handled through OnRamper's platform
- Webhook notifications update purchase status accordingly
- Customer support can track refund status through purchase history

## 11. Compliance

### KYC/AML
- OnRamper handles KYC/AML compliance for fiat payments
- Users may be required to complete verification on OnRamper's platform
- Your existing KYC system remains required for platform access

### Regulatory
- OnRamper is compliant with relevant financial regulations
- Ensure your jurisdiction allows crypto purchases via fiat
- Consider implementing additional compliance measures as needed

## 12. Configuration Verification

After setup, verify your integration by:

1. Check environment variables are properly set
2. Test API connectivity: `GET /api/onramper/defaults`
3. Verify webhook endpoint receives test payloads
4. Complete a test transaction end-to-end
5. Confirm purchase status updates correctly

## Need Help?

- OnRamper Documentation: https://docs.onramper.com
- OnRamper Support: Contact through your OnRamper dashboard
- Technical Issues: Check server logs for detailed error messages

---

**Important**: Never expose your API keys or webhook secrets in client-side code. All OnRamper API calls are made from your secure backend server.