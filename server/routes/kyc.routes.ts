import express, { NextFunction, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { KycController } from '../controllers/kyc.controller';

const router = express.Router();
// const app = express();
// Routes
router.post('/initiate', 
  requireAuth, 
  KycController.initiateKyc
);

router.get('/status', 
  requireAuth, 
  KycController.getKycStatus
);

router.post('/access-token', 
  requireAuth, 
  KycController.getAccessToken
);

router.post('/external-link', 
  requireAuth, 
  KycController.generateExternalLink
);

router.post('/webhook', 
  KycController.handleWebhook
);

router.get('/config', 
  KycController.getConfig
);

export default router;