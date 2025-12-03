# Unified Token Redemption Hook Documentation

## Overview

The `useTokenRedemption` hook is a unified solution for handling blockchain redemption requests for both Gold Reserve Tokens (GRT) and Silver Reserve Tokens (SRT). This hook provides functionality to request physical metal redemption and cancel pending redemption requests directly on the blockchain.

## Features

- **Dynamic Token Selection**: Automatically selects the correct contract address and ABI based on token type
- **Unified Interface**: Single hook for both gold and silver token redemptions
- **Type Safety**: Fully typed with TypeScript support
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Transaction Status**: Real-time redemption status tracking
- **Toast Notifications**: Built-in success and error notifications
- **Dual Functions**: Support for both requesting and cancelling redemptions

## Usage

### Basic Implementation

```typescript
import { useTokenRedemption, type TokenType } from '@/hooks/useTokenRedemption';

export default function RedemptionComponent() {
  const [tokenType, setTokenType] = useState<TokenType>('GOLD');
  
  const {
    requestRedemption,
    cancelRedemptionRequest,
    isPending,
    isConfirming,
    isConfirmed,
    transactionHash,
    error,
    isLoading
  } = useTokenRedemption(tokenType);

  const handleRedemptionRequest = async () => {
    try {
      await requestRedemption({
        tokenAmount: '5.0',
        deliveryAddress: '123 Main St, New York, NY 10001, USA',
        decimals: 18
      });
    } catch (error) {
      console.error('Redemption request failed:', error);
    }
  };

  const handleCancelRequest = async () => {
    try {
      await cancelRedemptionRequest({
        requestId: '12345'
      });
    } catch (error) {
      console.error('Cancellation failed:', error);
    }
  };

  return (
    <div>
      <select value={tokenType} onChange={(e) => setTokenType(e.target.value as TokenType)}>
        <option value="GOLD">Gold</option>
        <option value="SILVER">Silver</option>
      </select>
      
      <button 
        onClick={handleRedemptionRequest} 
        disabled={isLoading}
      >
        {isLoading ? 'Processing...' : `Request ${tokenType} Redemption`}
      </button>
      
      <button 
        onClick={handleCancelRequest} 
        disabled={isLoading}
      >
        Cancel Request
      </button>
      
      {isConfirmed && transactionHash && (
        <p>Transaction confirmed! TX: {transactionHash}</p>
      )}
    </div>
  );
}
```

## Hook Parameters

### `tokenType: TokenType`
The type of token for redemption operations. Must be either `'GOLD'` or `'SILVER'`.

## Hook Returns

### `requestRedemption(params: RedemptionRequestParams)`
Initiates a redemption request for physical metal delivery.

**Parameters:**
- `tokenAmount: string` - Amount of tokens to redeem (supports decimal values)
- `deliveryAddress: string` - Full delivery address for physical metals
- `decimals?: number` - Token decimals (default: 18)

### `cancelRedemptionRequest(params: CancelRedemptionParams)`
Cancels a pending redemption request.

**Parameters:**
- `requestId: string` - The ID of the redemption request to cancel

### `isPending: boolean`
Indicates if a transaction is being submitted to the blockchain.

### `isConfirming: boolean`
Indicates if the transaction is being confirmed on the blockchain.

### `isConfirmed: boolean`
Indicates if the transaction has been confirmed.

### `transactionHash: string | undefined`
The hash of the transaction (available after submission).

### `error: Error | null`
Any error that occurred during the redemption process.

### `isLoading: boolean`
Combined loading state (pending or confirming).

## Smart Contract Functions

### requestRedemption
```solidity
function requestRedemption(uint256 tokenAmount, string memory deliveryAddress) 
    external 
    returns (uint256 requestId)
```

**Parameters:**
- `tokenAmount` - Amount of tokens to redeem (in wei)
- `deliveryAddress` - Full delivery address string

**Returns:**
- `requestId` - Unique identifier for the redemption request

### cancelRedemptionRequest
```solidity
function cancelRedemptionRequest(uint256 requestId) 
    external 
    returns (bool success)
```

**Parameters:**
- `requestId` - The ID of the request to cancel

**Returns:**
- `success` - Boolean indicating if cancellation was successful

## Token Configurations

The hook uses the same configuration structure as the transfer hook:

```typescript
const TOKEN_CONFIGS: Record<TokenType, TokenConfig> = {
  GOLD: {
    contractAddress: import.meta.env.VITE_GOLD_TOKEN_CONTRACT,
    abi: grtABI,
    name: 'Gold Reserve Token',
    symbol: 'GRT'
  },
  SILVER: {
    contractAddress: import.meta.env.VITE_SILVER_TOKEN_CONTRACT,
    abi: srtAbi,
    name: 'Silver Reserve Token', 
    symbol: 'SRT'
  }
};
```

## Environment Variables

The hook requires the following environment variables:

- `VITE_GOLD_TOKEN_CONTRACT` - Gold token contract address
- `VITE_SILVER_TOKEN_CONTRACT` - Silver token contract address

## Error Handling

The hook provides comprehensive error handling for:

- **Invalid Token Amount**: When amount is zero or negative
- **Invalid Delivery Address**: When address is too short or empty
- **Invalid Request ID**: When request ID is not a valid number
- **Contract Errors**: When smart contract calls fail
- **Network Errors**: When blockchain connection fails
- **User Rejection**: When user rejects the transaction

## Integration Example

Here's how it integrates with the redemption page:

```typescript
export default function Redemption() {
  const [form, setForm] = useState({
    token: 'GOLD' as TokenType,
    quantity: '',
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });

  const {
    requestRedemption,
    isLoading,
    isConfirmed,
    transactionHash,
    error
  } = useTokenRedemption(form.token);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const fullAddress = `${form.streetAddress}, ${form.city}, ${form.state} ${form.zipCode}, ${form.country}`;
    
    try {
      await requestRedemption({
        tokenAmount: form.quantity,
        deliveryAddress: fullAddress,
        decimals: 18
      });
    } catch (error) {
      // Error is already handled by the hook with toast notifications
    }
  };

  return (
    // UI components using the hook state
  );
}
```

## Benefits

1. **Unified Interface**: Single hook for both token types
2. **Blockchain Integration**: Direct smart contract interaction
3. **Real-time Status**: Transaction status tracking
4. **Error Management**: Comprehensive error handling
5. **Type Safety**: Full TypeScript support
6. **Automatic Notifications**: Built-in success/error toasts
7. **Dual Operations**: Both request and cancel functionality

## Typical Workflow

1. **Request Redemption**: User submits redemption request with token amount and delivery address
2. **Smart Contract Call**: Hook calls `requestRedemption` function on the blockchain
3. **Request ID**: Contract returns a unique request ID for tracking
4. **Status Tracking**: Hook tracks transaction confirmation status
5. **Cancel Option**: User can cancel pending requests using the request ID

## Security Considerations

- **Address Validation**: Delivery addresses are validated for minimum length
- **Amount Validation**: Token amounts must be positive numbers
- **Request ID Validation**: Request IDs must be valid numbers
- **Contract Verification**: Environment variables are checked for valid contract addresses
- **User Confirmation**: All transactions require user wallet confirmation