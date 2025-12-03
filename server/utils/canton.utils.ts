import jwt from "jsonwebtoken";
import axios from "axios";

// RSA private key for signing (RS256)
const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCtV2YoelkqU8K3
6AA3v8RMFBpafQmkWqgelFBNE1vm2AiConVPSI4XyXg8HopPtsRSrJMKehEgxmc1
fjeJdQLvbyvGUPX/17kpRfaglyhlkZURe3rJqaDqeD16j0MJU9FXJ92oCSTEtVU/
TszB503ys8ADXJkOp4ru3BPbK36jgVOg2ZaT5TJ+TeWaNHInwQfo0Zd7B4pf6d3E
6iFnvR69xNiJ6t5w89/1OY0w1c590mL+kLujacENnMv0E4qjYuwhT8kR31p3/n4C
wcojxMPWs6nAdPxj8qVYqQ8PA/WsTll6t8gJuvibA5Y/XAmspiLvQxRT9e1XrHzY
/jJLh5pFAgMBAAECggEAD6nyylYCa4FcLcaiPM3W2dHrO7tKCfcQDPHCe+SNWapM
XCzjRIHXwHogcLy8K03mjPRmHGLbD2CLM3NJAEisz9QpwYCcnXAlN3/IZ8sHbhfR
jHd7D6QerXFy8ZNM/H4wtmgc1WVvuoxxIqJm45LL7jjXpILtAqNmbTh0w7AF5pWc
2hc5xfglT1IehZ4GQDOBRRWbIIWbFPh4ZhlYeYl/hvFKs4POVtPYisyV5DPM+0qj
WYfnJ0z8Xa6iXsz+PuCcdXrNm1m4K7yQOjp8zHcK9CHIGWpTTMpVWd3Xl4INRYDk
TSXqkPR5PIXTRat05EHelg0l86Xe4/r6lgQBhp1h1QKBgQDg/JI2suhNoHBwwoq0
4KS/bYQSlSHCL/CG/vRrvBlaO/WXjPZ+AmWiVa8oIzkz+X87xgvsBxPDFjwppmFM
5f2CEpVpQrqAAn96Qfy4Yn640Kx/B2i//8kUmOEycEI4XhP/rAwHamarKz4ZzPKH
WrzEQ9Davh9yMnjkD39m+5jC5wKBgQDFPFlCWKTqJWnW0utE0d8juMKLEvF2OJY/
DTEjtvL5bIy1QqHWHLFRCfXcu4K8tKJ5Kd8DiPbPwx2lmsNkRzOyd8AGThIfQcX6
WxPEgFykNFgqJMt3zDVwKhx43wrYnlIiWo/beNaOFCT5pWFMLWUcLCUdvQ+qI8Nu
sVTmo7p/8wKBgHfsiS9Y29SM4YJpYDAb0hUrlgulrHHqxcXfXn+SqtzbOwSGIdl3
A5+tFolJhTM8GWLOJQqxlwoU7wqwYgrwSNmteDC8Xdbf/f038TKDZdKzgE7Rrzcw
a4lsGBWfmtya4QQWO+8z+vfgO+Dayqf1aMsg7tG6J97iImhGDn3hPEMfAoGBAI5t
FtOnKWd/nt8nLgdjOiwUdj9xbXX+RNjBEPQGX4ynyy/1LuJrk8u+UpGTwkO8ePrf
tpBZ7kh3UEhO6rvWAsnkWYD0DXgOygUQkcS7IKreta+xJFCc4RXfAvJxteZY5Vyz
YuCMcPrmJxEzUIBu422lnyPLa61j5/NeEL4AC2PrAoGBAIHfO6Kk4eWVb46+GL00
pbUS+42LdeI+kx5O/uU1/b2HKQhttaI0keXuuwnJuGgr2H+kW58Irdg/BlaGwIHs
0ac2xFDsgBk/zCvWAGyrf899v14Lo23/RrPm5S0qxYDj7VwHsytklf9gfHM9GAby
tXrsJulVZwRWFWv2AcwiPSJ5
-----END PRIVATE KEY-----`;

interface CantonTokenOptions {
  userRole?: string;
  scope?: string;
  audience?: string;
  issuer?: string;
  expiryHours?: number;
  actAs?: string[];
  readAs?: string[];
}

/**
 * Creates a Canton JWT token with the specified options
 * @param options - Token configuration options
 * @returns JWT token string
 */
export function createCantonToken(options: CantonTokenOptions): string {
  const { userRole } = options;

  const payload = {
    scope: "daml_ledger_api",
    aud: "https://daml.com/jwt/aud/participant/participant1",
    sub: userRole,
    iss: "canton-jwt-issuer",
    exp: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(payload, privateKey, { algorithm: "RS256" });
}

/**
 * Creates a token for a specific username with default settings
 * @param username - The username for the token
 * @returns JWT token string
 */
export function createUserToken(username: string): string {
  return createCantonToken({
    userRole: username,   
  });
}

export function generateMultiPartyToken(tokenName:string, parties:string[]) {
    // Create multi-party JWT token for operations like Transfer
    let payload = {
        scope: "daml_ledger_api",  // Must match target-scope in config
        aud: "https://daml.com/jwt/aud/participant/participant1",  // Must match target-audience in Canton config
        sub: tokenName,            // Subject is a descriptive name
        iss: "canton-jwt-issuer",  // Issuer identifier
        exp: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60), // 1 year expiry
        iat: Math.floor(Date.now() / 1000),  // Issued at
        actAs: parties,            // Multiple parties that can act
        readAs: parties,
        applicationId: "rwa-json-api",// Same parties for read access
    };

    console.log(`Generating multi-party token: ${tokenName}`);
    console.log(`Parties included: ${parties.join(', ')}`);

    // Sign the JWT using the private key and RS256 algorithm
    const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' });

    return token;
}

/**
 * Create a BANK_ADMIN_TOKEN for Canton queries
 * @returns JWT token string for bank admin operations
 */
export function createBankAdminToken(): string {
  const payload = {
    scope: "daml_ledger_api",
    aud: "https://daml.com/jwt/aud/participant/participant1",
    sub: "bank_admin",
    iss: "canton-jwt-issuer",
    exp: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(payload, privateKey, { algorithm: "RS256" });
}

/**
 * Query Canton for contract ID by symbol
 * @param symbol - Token symbol (GLD or SLV)
 * @returns Contract ID for the specified symbol
 */
export async function getContractIdBySymbol(symbol: "GLD" | "SLV"): Promise<string | null> {
  try {
    const bankAdminToken = createBankAdminToken();
    
    const response = await axios.post(`${process.env.CANTON_API_BASE_URL}/query`, {
      templateIds: ["323be96aa0b9cd4a6f9cf17a5096b7a69c0cc2da28d31baa5e53c72f2c8ce9c1:TokenExample:AssetRegistry"],
      query: { symbol }
    }, {
      headers: {
        'Authorization': `Bearer ${bankAdminToken}`,
        'Content-Type': 'application/json'
      }
    });

    // Return the contractId from the first result
    if (response.data?.result && response.data.result.length > 0) {
      return response.data.result[0].contractId;
    }
    
    return null;
  } catch (error) {
    console.error(`Error querying contract ID for symbol ${symbol}:`, error);
    throw error;
  }
}