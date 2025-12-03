# Network-Specific Redemption Cancellation Implementation

## Overview
This document outlines the implementation of network-aware redemption cancellation logic in the Vaulted Assets platform. The cancellation system now intelligently handles different blockchain networks (Solana, Ethereum, Private) with appropriate blockchain interactions and database updates.

## Architecture Changes

### Previous Implementation
- Used a single `cancelRedemption` DELETE API for all networks
- Applied the same blockchain cancellation logic regardless of network
- Limited error handling and network-specific requirements

### New Implementation
- Network-specific cancellation logic with conditional blockchain interactions
- Uses `updateRedemption` PUT API instead of DELETE API
- Enhanced error handling with fallback database updates
- Separate logic paths for Solana, Ethereum, and Private networks

## Network-Specific Logic

### Solana Network
1. **Blockchain Interaction**: Calls `cancelSolanaRedemptionRequest(requestId)` if requestId exists
2. **Database Update**: Uses `updateRedemption` API to change status to "cancelled"
3. **Error Handling**: Continues with database update even if blockchain call fails
4. **Toast Message**: Shows Solana-specific success message

### Ethereum Network  
1. **RequestId Validation**: Checks if requestId exists and is not "0"
2. **Blockchain Interaction**: Calls appropriate hook (`goldRedemptionHook` or `silverRedemptionHook`) based on token type
3. **Database Update**: Uses `updateRedemption` API to change status to "cancelled"
4. **Error Handling**: Continues with database update even if blockchain call fails
5. **Toast Message**: Shows Ethereum-specific success message

### Private Network
1. **Database Only**: No blockchain interaction required
2. **Database Update**: Uses `updateRedemption` API to change status to "cancelled"
3. **Toast Message**: Shows generic success message

## Key Components

### Hook Integration
```typescript
// Solana redemption hook with cancellation
const {
  requestRedemption: requestSolanaRedemption,
  cancelRedemptionRequest: cancelSolanaRedemptionRequest,
  status: solanaStatus,
  isLoading: isSolanaLoading,
  transactionHash: solanaTransactionHash,
  requestId: solanaRequestId,
  error: solanaError,
  reset: resetSolana,
} = useSolanaTokenRedemption(form.token as SolanaTokenType);

// Ethereum redemption hooks for cancellation
const goldRedemptionHook = useTokenRedemption("GOLD");
const silverRedemptionHook = useTokenRedemption("SILVER");

// Database operations
const { createRedemption, updateRedemption, cancelRedemption } = useRedemption();
```

### API Changes
- **New**: `updateRedemption(redemptionId, updates, walletAddress)` - Updates redemption status
- **Legacy**: `cancelRedemption(redemptionId, walletAddress)` - DELETE API (marked for removal)

### Status Values
- Uses "cancelled" (British spelling) to match schema definitions
- Status change: "pending" → "cancelled"

## Error Handling Strategy

### Blockchain Failures
- Blockchain cancellation errors are logged but don't prevent database updates
- Ensures redemption status is always updated even if blockchain interaction fails
- Provides user feedback about the cancellation regardless of blockchain success

### Wallet Validation
- Verifies wallet connection before attempting cancellation
- Validates wallet address matches redemption owner
- Provides appropriate error messages for validation failures

## User Experience

### Toast Messages
- **Solana**: "redemption.solanaRedemptionCanceled"
- **Ethereum**: "redemption.ethereumRedemptionCanceled"  
- **Private/Other**: "redemption.redemptionCanceledSuccessfully"

### Loading States
- Button disabled during cancellation process
- Loading spinner with "Processing..." text
- Network-specific status messages where applicable

## Implementation Benefits

1. **Network Awareness**: Proper handling of different blockchain requirements
2. **Fault Tolerance**: Graceful degradation when blockchain calls fail
3. **User Clarity**: Network-specific feedback and error messages
4. **Data Consistency**: Ensures database always reflects user intent
5. **Scalability**: Easy to add support for additional networks

## Future Enhancements

- Add support for additional blockchain networks
- Implement retry mechanisms for failed blockchain calls
- Add detailed logging for audit trails
- Consider batch cancellation operations

## Migration Notes

- Existing redemptions continue to work with legacy DELETE API
- New cancellations use PUT API with status updates
- Gradual migration path allows for testing and validation
- Backward compatibility maintained during transition period