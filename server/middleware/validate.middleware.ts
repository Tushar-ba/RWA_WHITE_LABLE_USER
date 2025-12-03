import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

// Extended Request interface to include validated data
export interface ValidatedRequest<T = any> extends Request {
  validated: T;
}

/**
 * Middleware to validate request body using Zod schema
 * @param schema - Zod validation schema
 * @returns Express middleware function
 */
export const validate = <T>(schema: ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validationResult = schema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validationResult.error.errors 
        });
      }

      // Attach validated data to request object
      (req as ValidatedRequest<T>).validated = validationResult.data;
      next();
    } catch (error) {
      console.error('Validation middleware error:', error);
      res.status(500).json({ 
        message: "Internal validation error" 
      });
    }
  };
};