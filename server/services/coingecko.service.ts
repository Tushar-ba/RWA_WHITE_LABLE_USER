import axios from 'axios';

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';
const API_KEY = 'CG-oeS4wPkg7gDUhLMBfTmG5W1c';

export interface EthereumPrice {
  ethereum: {
    usd: number;
  };
}

export class CoinGeckoService {
  private static instance: CoinGeckoService;
  
  private constructor() {}
  
  public static getInstance(): CoinGeckoService {
    if (!CoinGeckoService.instance) {
      CoinGeckoService.instance = new CoinGeckoService();
    }
    return CoinGeckoService.instance;
  }

  /**
   * Fetch ETH price in USD from CoinGecko API
   * @returns Promise<number> - ETH price in USD
   */
  async getEthereumPrice(): Promise<number> {
    try {
      const response = await axios.get<EthereumPrice>(
        `${COINGECKO_API_BASE}/simple/price`,
        {
          params: {
            ids: 'ethereum',
            vs_currencies: 'usd'
          },
          headers: {
            'x-cg-demo-api-key': API_KEY,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        }
      );

      if (!response.data?.ethereum?.usd) {
        throw new Error('Invalid response structure from CoinGecko API');
      }

      return response.data.ethereum.usd;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('CoinGecko API Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        });
        
        if (error.response?.status === 429) {
          throw new Error('CoinGecko API rate limit exceeded. Please try again later.');
        }
        
        if (error.response?.status === 401 || error.response?.status === 403) {
          throw new Error('CoinGecko API authentication failed. Invalid API key.');
        }
        
        throw new Error(`CoinGecko API request failed: ${error.response?.statusText || error.message}`);
      }
      
      console.error('Unexpected error fetching ETH price:', error);
      throw new Error('Failed to fetch ETH price from CoinGecko');
    }
  }

  /**
   * Fetch multiple cryptocurrency prices
   * @param coinIds - Array of coin IDs (e.g., ['ethereum', 'bitcoin'])
   * @param vsCurrencies - Array of vs currencies (e.g., ['usd', 'eur'])
   * @returns Promise<any> - Price data object
   */
  async getMultiplePrices(coinIds: string[], vsCurrencies: string[] = ['usd']): Promise<any> {
    try {
      const response = await axios.get(
        `${COINGECKO_API_BASE}/simple/price`,
        {
          params: {
            ids: coinIds.join(','),
            vs_currencies: vsCurrencies.join(',')
          },
          headers: {
            'x-cg-demo-api-key': API_KEY,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('CoinGecko API Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        });
        
        throw new Error(`CoinGecko API request failed: ${error.response?.statusText || error.message}`);
      }
      
      console.error('Unexpected error fetching prices:', error);
      throw new Error('Failed to fetch prices from CoinGecko');
    }
  }
}

// Export singleton instance
export const coinGeckoService = CoinGeckoService.getInstance();