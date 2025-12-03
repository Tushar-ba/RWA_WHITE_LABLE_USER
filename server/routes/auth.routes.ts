import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import { requireAuth } from '../middleware/auth.middleware';
import { 
  signupSchema, 
  verifyEmailSchema, 
  loginSchema,
  verify2FASchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updatePasswordSchema,
  resendOTPSchema
} from '../schemas/auth.schema';
import { asyncHandler } from '../middleware/error.middleware';

const router = Router();

// Public authentication routes
router.post('/signup', 
  validate(signupSchema), 
  asyncHandler(AuthController.signup)
);

router.post('/verify-email', 
  validate(verifyEmailSchema), 
  asyncHandler(AuthController.verifyEmail)
);

router.post('/login', 
  validate(loginSchema), 
  asyncHandler(AuthController.login)
);

router.post('/verify-2fa', 
  validate(verify2FASchema), 
  asyncHandler(AuthController.verify2FA)
);

router.post('/forgot-password', 
  validate(forgotPasswordSchema), 
  asyncHandler(AuthController.forgotPassword)
);

router.post('/reset-password', 
  validate(resetPasswordSchema), 
  asyncHandler(AuthController.resetPassword)
);

router.post('/resend-otp', 
  validate(resendOTPSchema), 
  asyncHandler(AuthController.resendOTP)
);

// Protected authentication routes (require valid JWT token)
router.post('/update-password', 
  requireAuth,
  validate(updatePasswordSchema), 
  asyncHandler(AuthController.updatePassword)
);

export default router;