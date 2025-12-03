import { grtABI } from '../../abi/grtABI';
import { srtAbi } from '../../abi/srtAbi';
import { ENV } from '@shared/constants';

export type TokenType = 'GOLD' | 'SILVER';

export interface RedemptionRequestParams {
  tokenAmount: string;
  decimals?: number;
}

export interface CancelRedemptionParams {
  requestId: string;
}

export interface TokenConfig {
  contractAddress: string;
  abi: any[];
  name: string;
  symbol: string;
}

// Token configurations object
export const TOKEN_CONFIGS: Record<TokenType, TokenConfig> = {
  GOLD: {
    contractAddress: EVM_GOLD_TOKEN_CONTRACT?.trim() || '',
    abi: grtABI,
    name: 'Gold Reserve Token',
    symbol: 'GRT',
  },
  SILVER: {
    contractAddress: EVM_SILVER_TOKEN_CONTRACT?.trim() || '',
    abi: srtAbi,
    name: 'Silver Reserve Token',
    symbol: 'SRT',
  },
};