import { Router } from 'express';
import { ContactController } from '../controllers/contact.controller';
import { validate } from '../middleware/validate.middleware';
import { contactFormSchema } from '../../shared/schema';
import { asyncHandler } from '../middleware/error.middleware';

const router = Router();

// POST /api/contact - Submit contact form
router.post('/', 
  validate(contactFormSchema), 
  asyncHandler(ContactController.submitContactForm)
);

export default router;