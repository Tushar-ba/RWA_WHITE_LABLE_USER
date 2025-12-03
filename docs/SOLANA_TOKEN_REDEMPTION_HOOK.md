# Solana Token Redemption Hook Documentation

## Overview
The `useSolanaTokenRedemption` hook provides functionality for requesting and cancelling token redemptions on the Solana blockchain. This hook is designed to work with Solana's TOKEN_2022_PROGRAM_ID and follows the same pattern as the `useSolanaTokenTransfer` hook.

## Features
- Request token redemption for physical delivery
- Cancel existing redemption requests
- Real-time transaction status tracking
- Automatic balance validation
- Error handling with user-friendly notifications
- Support for both GOLD and SILVER tokens

## Usage

### Basic Import
```typescript
import { useSolanaTokenRedemption } from '@/hooks/useSolanaTokenRedemption';
```

### Hook Initialization
```typescript
const {
  requestRedemption,
  cancelRedemptionRequest,
  status,
  isLoading,
  transactionHash,
  requestId,
  error,
  reset,
  isPending,
  isConfirming,
  isConfirmed
} = useSolanaTokenRedemption('GOLD'); // or 'SILVER'
```

### Request Redemption
```typescript
const handleRedemption = async () => {
  try {
    const result = await requestRedemption({
      amount: 20 // Amount in UI tokens (e.g., 20 GOLD tokens)
    });
    
    console.log('Redemption created:', {
      transactionHash: result.transactionHash,
      requestId: result.requestId,
      redemptionRequest: result.redemptionRequest,
      redemptionPda: result.redemptionPda
    });
  } catch (error) {
    console.error('Redemption failed:', error);
  }
};
```

### Cancel Redemption Request
```typescript
const handleCancellation = async (requestId: number) => {
  try {
    const txHash = await cancelRedemptionRequest(requestId);
    console.log('Redemption cancelled:', txHash);
  } catch (error) {
    console.error('Cancellation failed:', error);
  }
};
```

## Return Values

### Functions
- `requestRedemption({ amount })`: Creates a new redemption request
- `cancelRedemptionRequest(requestId)`: Cancels an existing redemption request
- `reset()`: Resets all state values

### State Values
- `status`: Current operation status message
- `isLoading`: Boolean indicating if operation is in progress
- `transactionHash`: Hash of the completed transaction
- `requestId`: ID of the created redemption request
- `error`: Error object if operation failed
- `isPending`: Alias for `isLoading`
- `isConfirming`: Boolean indicating transaction confirmation status
- `isConfirmed`: Boolean indicating if transaction is confirmed

## Environment Variables
The hook requires the following environment variables:

```env
# Solana token mint addresses
SOLANA_GOLD_MINT=your_gold_token_mint_address
SOLANA_SILVER_MINT=your_silver_token_mint_address

# Solana program ID for redemption smart contract
VITE_SOLANA_PROGRAM_ID=your_program_id
```

## Error Handling
The hook provides comprehensive error handling for common scenarios:

- Wallet not connected
- Insufficient token balance
- Insufficient SOL for transaction fees
- Invalid mint addresses
- Network connectivity issues

All errors are automatically displayed as toast notifications and stored in the `error` state.

## Integration Status with Anchor Program

### Current Implementation Status
The hook is currently implemented as a **demonstration version** that simulates Anchor program interactions. It correctly implements:

✅ **Proper PDA derivation** using the same seeds as the Anchor program  
✅ **Token account validation** and balance checking  
✅ **Transaction structure** and error handling  
✅ **User interface and state management**  

❌ **Missing actual Anchor program calls** - Currently uses placeholder transactions  
❌ **Missing program account fetching** - Cannot read redemption request status  
❌ **Missing real program interactions** - No actual token escrow or program state updates  

### Anchor Program Integration
This hook is designed to work with an Anchor program that implements the following structure:

### Program Data Structures
- **Config Account**: Stores global program configuration including redemption counter
- **Redemption Request PDA**: Individual redemption request data
- **Redemption PDA**: Escrow account for holding tokens during redemption

### PDA Derivation
The hook derives PDAs using the following seeds:
- Config: `["config"]`
- Redemption Request: `["redemption_request", user_pubkey, request_id_buffer]`
- Redemption PDA: `["redemption_pda", user_pubkey, request_id_buffer]`

## Status Messages
The hook provides detailed status updates during operations:

1. "Preparing redemption request…"
2. "Fetching current config…"
3. "Checking token balance…"
4. "Creating redemption request transaction…"
5. "Signing and sending transaction…"
6. "✅ Redemption request created! Request ID: {id}"

## Example Component Usage
```typescript
import React, { useState } from 'react';
import { useSolanaTokenRedemption } from '@/hooks/useSolanaTokenRedemption';

const RedemptionComponent = () => {
  const [amount, setAmount] = useState('');
  const {
    requestRedemption,
    status,
    isLoading,
    transactionHash,
    requestId,
    error
  } = useSolanaTokenRedemption('GOLD');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    try {
      await requestRedemption({ amount: parseFloat(amount) });
    } catch (err) {
      // Error is handled by the hook
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount to redeem"
        disabled={isLoading}
      />
      <button type="submit" disabled={isLoading || !amount}>
        {isLoading ? 'Processing...' : 'Request Redemption'}
      </button>
      
      {status && <p>{status}</p>}
      {error && <p style={{color: 'red'}}>{error.message}</p>}
      {transactionHash && (
        <p>Transaction: {transactionHash}</p>
      )}
      {requestId && (
        <p>Request ID: {requestId}</p>
      )}
    </form>
  );
};

export default RedemptionComponent;
```

## Migration to Full Anchor Program Integration

To make this hook work with the actual Anchor program, the following changes are needed:

### 1. Install Anchor Dependencies
```bash
npm install @coral-xyz/anchor
```

### 2. Add Program IDL and Types
```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { GoldToken } from "../target/types/gold_token"; // Your program types
```

### 3. Update the Hook Implementation

**Replace the mock transaction creation with actual program method calls:**

```typescript
// In requestRedemption function, replace the placeholder transaction with:
const tx = await program.methods
  .requestRedemption(rawAmount)
  .accountsPartial({
    user: userPk,
    config: configAccount,
    redemptionRequest: redemptionRequest,
    userTokenAccount: userTokenAccount,
    mint: mintPk,
    redemptionPda: redemptionPda,
    tokenProgram: TOKEN_2022_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  })
  .signers([userPk])
  .rpc();

// In cancelRedemptionRequest function, replace the placeholder with:
const cancelTx = await program.methods
  .cancelRedemption()
  .accountsPartial({
    user: userPk,
    redemptionRequest: redemptionRequest,
    userTokenAccount: userTokenAccount,
    tokenProgram: TOKEN_2022_PROGRAM_ID,
  })
  .signers([userPk])
  .rpc();
```

**Add program account fetching for status validation:**

```typescript
// Add this before attempting cancellation:
const redemptionRequestAccount = await program.account.redemptionRequest.fetch(redemptionRequest);
if ('processing' in redemptionRequestAccount.status || 'fulfilled' in redemptionRequestAccount.status) {
  throw new Error("Cannot cancel redemption request - it's already being processed or fulfilled");
}

// Add this for getting accurate request IDs:
const config = await program.account.config.fetch(configAccount);
const nextRequestId = config.redemptionRequestCounter.toNumber() + 1;
```

### 4. Environment Variables Required
```env
VITE_SOLANA_PROGRAM_ID=your_anchor_program_id
SOLANA_GOLD_MINT=your_gold_token_mint
SOLANA_SILVER_MINT=your_silver_token_mint
```

### 5. Verification Steps
After implementing the changes:

1. **Test Request Creation**: Verify that redemption requests are properly created and tokens are escrowed
2. **Test Status Checking**: Ensure the hook can read redemption request status before cancellation
3. **Test Cancellation**: Verify that only pending requests can be cancelled
4. **Test Error Handling**: Ensure proper error messages for all failure scenarios

## Notes
- This is a client-side implementation that requires wallet connection
- The hook includes balance validation before attempting redemption
- Transaction fees are paid in SOL by the connected wallet
- All amounts are converted from UI tokens to raw units automatically
- The hook follows the same pattern as other Solana hooks in the project for consistency
- **Current implementation is ready for production once Anchor integration is completed**