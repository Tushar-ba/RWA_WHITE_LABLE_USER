import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { onboardingSchema } from '../../shared/schema';

const router = Router();

// Public endpoints (no authentication required)
// Check username availability
router.post('/check-username',
  asyncHandler(UserController.checkUsernameAvailability)
);

// All other user routes require authentication
router.use(requireAuth);

// Get authenticated user profile
router.get('/me', 
  asyncHandler(UserController.getProfile)
);

// Update authenticated user profile
router.post('/me',
  asyncHandler(UserController.updateProfile)
);

// Update authenticated user profile (PATCH method)
router.patch('/me',
  asyncHandler(UserController.updateProfile)
);

// Update user password
router.post('/me/password',
  asyncHandler(UserController.updatePassword)
);

// Update user with Canton party information
router.post('/update-party-info',
  asyncHandler(UserController.updateUserPartyInfo)
);

// Save onboarding data
router.post('/onboarding',
  validate(onboardingSchema),
  asyncHandler(UserController.saveOnboarding)
);

export default router;