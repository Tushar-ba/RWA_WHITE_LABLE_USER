import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { storage } from '../storage/index.js';
import { Logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { createUserToken } from '../utils/canton.utils';

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

interface GenerateTokenRequest {
  userRole: string;
}

interface GenerateMultiPartyTokenRequest {
  tokenName: string;
  parties: string[];
}

interface AllocatePartyRequest {
  identifierHint: string;
  displayName: string;
  token?: string; // Optional, will generate if not provided
}

interface CreateUserRequest {
  userId: string;
  primaryParty: string;
  rights: Array<{
    type: 'CanActAs' | 'CanReadAs';
    party: string;
  }>;
  token?: string; // Optional, will generate if not provided
}

export class TokenController {
  /**
   * Create a bank token user in Canton
   */
  private static async createBankTokenUser(username: string, partyId: string): Promise<void> {
    const bankTokenUserId = `${username}_bank_token`;
    const newBankPartyId = "NewBank::1220b845dcf0d9cf52ce1e7457a744a6f3de7eff4a9ee95261b69405d1e0de8a768d";
    
    console.log(`Creating bank token user: ${bankTokenUserId} with parties: ${partyId}, ${newBankPartyId}`);
    const authToken = createUserToken("participant_admin")
    await axios.post(`${process.env.CANTON_API_BASE_URL}/user/create`, {
      userId: bankTokenUserId,
      rights: [
        { type: "CanActAs", party: partyId },
        { type: "CanActAs", party: newBankPartyId },
        { type: "CanReadAs", party: partyId },
        { type: "CanReadAs", party: newBankPartyId }
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    Logger.info(`Bank token user created successfully: ${bankTokenUserId}`);
  }
  /**
   * Generate JWT token for a specific user role
   */
  static async generateToken(req: Request, res: Response): Promise<void> {
    try {
      // Get username from query parameters (e.g., ?username=NewAlice)
      const { username } = req.query;
      
      // Also support legacy userRole from body for backward compatibility
      const { userRole } = req.body as GenerateTokenRequest;
      
      const finalUsername = (username as string) || userRole;

      if (!finalUsername) {
        res.status(400).json({
          message: 'username (query parameter) or userRole (body) is required',
          error: 'Missing required field: username or userRole'
        });
        return;
      }

      console.log(`Generating user-based token for Canton user: ${finalUsername}`);
      console.log(`Token will reference existing Canton user with ID: ${finalUsername}`);

      // Use the utility function to create the token
      const token = createUserToken(finalUsername);

      res.status(200).json({
        message: 'Token generated successfully',
        token,
        username: finalUsername,
        userRole: finalUsername, // For backward compatibility
        expiresIn: '1 year'
      });

    } catch (error) {
      console.error('Token generation error:', error);
      res.status(500).json({
        message: 'Internal server error during token generation',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Generate multi-party JWT token for operations like Transfer
   */
  static async generateMultiPartyToken(req: Request, res: Response): Promise<void> {
    try {
      const { tokenName, parties } = req.body as GenerateMultiPartyTokenRequest;

      if (!tokenName) {
        res.status(400).json({
          message: 'tokenName is required',
          error: 'Missing required field: tokenName'
        });
        return;
      }

      if (!parties || !Array.isArray(parties) || parties.length === 0) {
        res.status(400).json({
          message: 'parties array is required and cannot be empty',
          error: 'Missing or invalid field: parties'
        });
        return;
      }

      // Create multi-party JWT token for operations like Transfer
      const payload = {
        scope: "daml_ledger_api",  // Must match target-scope in config
        aud: "https://daml.com/jwt/aud/participant/participant1",  // Must match target-audience in Canton config
        sub: tokenName,            // Subject is a descriptive name
        iss: "canton-jwt-issuer",  // Issuer identifier
        exp: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60), // 1 year expiry
        iat: Math.floor(Date.now() / 1000),  // Issued at
        actAs: parties,            // Multiple parties that can act
        readAs: parties            // Same parties for read access
      };

      console.log(`Generating multi-party token: ${tokenName}`);
      console.log(`Parties included: ${parties.join(', ')}`);

      // Sign the JWT using the private key and RS256 algorithm
      const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' });

      res.status(200).json({
        message: 'Multi-party token generated successfully',
        token,
        tokenName,
        parties,
        expiresIn: '1 year'
      });

    } catch (error) {
      console.error('Multi-party token generation error:', error);
      res.status(500).json({
        message: 'Internal server error during multi-party token generation',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Allocate a new party in Canton and update user record
   */
  static async allocateParty(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { identifierHint, displayName, token } = req.body as AllocatePartyRequest;

      if (!identifierHint || !displayName) {
        res.status(400).json({
          message: 'identifierHint and displayName are required',
          error: 'Missing required fields'
        });
        return;
      }

      // Use provided token or generate a participant_admin token
      let authToken = token;
      if (!authToken) {
        const payload = {
          scope: "daml_ledger_api",
          aud: "https://daml.com/jwt/aud/participant/participant1",
          sub: "participant_admin",
          iss: "canton-jwt-issuer",
          exp: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
          iat: Math.floor(Date.now() / 1000),
        };
        authToken = jwt.sign(payload, privateKey, { algorithm: "RS256" });
      }

      console.log(`Allocating party: ${identifierHint} (${displayName})`);

      // Make API call to Canton
      const response = await axios.post('http://37.27.190.172/v1/parties/allocate', {
        identifierHint,
        displayName
      }, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      // After successful party allocation, update user record and create Canton user
      const userId = req.user?.user_id;
      if (userId && response.data?.result?.identifier) {
        const partyId = response.data.result.identifier;
        
        try {
          // Update user record with username and partyId
          await storage.updateUser(userId, {
            username: identifierHint, // Use identifierHint as username
            partyId: partyId,
          });
          
          Logger.info(`Updated user ${userId} with username: ${identifierHint} and partyId: ${partyId}`);
          
          // Automatically create Canton user with rights
          console.log(`Creating Canton user: ${identifierHint} with primary party: ${partyId}`);
          
          await axios.post('http://37.27.190.172/v1/user/create', {
            userId: identifierHint,
            primaryParty: partyId,
            rights: [
              {
                type: "CanActAs",
                party: partyId,
              },
              {
                type: "CanReadAs", 
                party: partyId,
              },
            ]
          }, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          Logger.info(`Canton user created successfully for ${identifierHint}`);
          
          // Create bank token user
          await TokenController.createBankTokenUser(identifierHint, partyId);
          
        } catch (updateError) {
          Logger.error('Failed to update user with party info or create Canton user:', updateError);
          // Continue with success response even if user update/Canton user creation fails
        }
      }

      res.status(200).json({
        message: 'Party allocated successfully',
        data: response.data,
        identifierHint,
        displayName
      });

    } catch (error) {
      console.error('Party allocation error:', error);
      if (axios.isAxiosError(error)) {
        res.status(error.response?.status || 500).json({
          message: 'Party allocation failed',
          error: error.response?.data || error.message
        });
      } else {
        res.status(500).json({
          message: 'Internal server error during party allocation',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  /**
   * Create a new user in Canton
   */
  static async createUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId, primaryParty, rights, token } = req.body as CreateUserRequest;

      if (!userId || !primaryParty || !rights || !Array.isArray(rights)) {
        res.status(400).json({
          message: 'userId, primaryParty, and rights array are required',
          error: 'Missing required fields'
        });
        return;
      }

      // Use provided token or generate a participant_admin token
      let authToken = token;
      if (!authToken) {
        const payload = {
          scope: "daml_ledger_api",
          aud: "https://daml.com/jwt/aud/participant/participant1",
          sub: "participant_admin",
          iss: "canton-jwt-issuer",
          exp: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
          iat: Math.floor(Date.now() / 1000),
        };
        authToken = jwt.sign(payload, privateKey, { algorithm: "RS256" });
      }

      console.log(`Creating user: ${userId} with primary party: ${primaryParty}`);

      // Make API call to Canton
      const response = await axios.post('http://37.27.190.172/v1/user/create', {
        userId,
        primaryParty,
        rights
      }, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      res.status(200).json({
        message: 'User created successfully',
        data: response.data,
        userId,
        primaryParty,
        rights
      });

    } catch (error) {
      console.error('User creation error:', error);
      if (axios.isAxiosError(error)) {
        res.status(error.response?.status || 500).json({
          message: 'User creation failed',
          error: error.response?.data || error.message
        });
      } else {
        res.status(500).json({
          message: 'Internal server error during user creation',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }
}