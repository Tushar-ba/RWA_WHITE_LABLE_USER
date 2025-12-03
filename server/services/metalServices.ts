// services/metalService.ts
import axios from "axios";

const METALS_API = "https://api.metals.dev/v1/timeseries";
const API_KEY: string =
  process.env.METALS_API_KEY || "9G47YZ8V6WFU4DC5PGUR102C5PGUR"; // ⚠️ keep key in env

// Type for API response entry
interface MetalEntry {
  metals?: {
    gold?: number;
    silver?: number;
  };
}

// Type for normalized prices
export interface MetalPrices {
  [date: string]: {
    gold: number;
    silver: number;
  };
}

/**
 * Fetch daily gold/silver prices from API
 * @param startDate YYYY-MM-DD
 * @param endDate YYYY-MM-DD
 */
export async function getMetalPrices(
  startDate: string,
  endDate: string
): Promise<MetalPrices> {
  const { data } = await axios.get<{ rates?: Record<string, MetalEntry> }>(
    METALS_API,
    {
      params: {
        api_key: API_KEY,
        start_date: startDate,
        end_date: endDate,
      },
      headers: { Accept: "application/json" },
    }
  );

  if (!data?.rates) {
    throw new Error("Invalid API response: missing rates");
  }

  // Normalize: { "YYYY-MM-DD": { gold, silver } }
  const prices: MetalPrices = {};
  for (const [date, entry] of Object.entries(data.rates)) {
    prices[date] = {
      gold: entry.metals?.gold ?? 0,
      silver: entry.metals?.silver ?? 0,
    };
  }
  return prices;
}
