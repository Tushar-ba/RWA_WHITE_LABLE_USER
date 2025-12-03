import { Router } from 'express';
import { TokenController } from '../controllers/token.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route POST /api/tokens/generate-token
 * @description Generate JWT token for a specific user role
 * @body {userRole}
 */
router.post('/generate-token', TokenController.generateToken);

/**
 * @route POST /api/tokens/generate-multiparty-token
 * @description Generate multi-party JWT token for operations like Transfer
 * @body {tokenName, parties}
 */
router.post('/generate-multiparty-token', TokenController.generateMultiPartyToken);

/**
 * @route POST /api/tokens/allocate-party
 * @description Allocate a new party in Canton and update user record
 * @body {identifierHint, displayName, token?}
 * @requires Authentication
 */
router.post('/allocate-party', requireAuth, TokenController.allocateParty);

/**
 * @route POST /api/tokens/create-user
 * @description Create a new user in Canton
 * @body {userId, primaryParty, rights, token?}
 */
router.post('/create-user', TokenController.createUser);

export { router as tokenRoutes };