import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

/**
 * @desc    Validate request body, query, and params against Zod schema
 * @param   schema Zod schema object
 */
export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: "Validatsiya xatosi",
          code: "VALIDATION_ERROR",
          details: error.errors
        });
      }
      return next(error);
    }
  };
};
