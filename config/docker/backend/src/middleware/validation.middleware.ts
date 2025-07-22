import { strictDateExtraction } from "../utils/dateStrict";
import { safeStrictDateExtraction } from "../utils/dateStrict";
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError, z } from 'zod';

// Define a schema structure that matches your validation needs
export const requestSchema = <T extends AnyZodObject>(bodySchema: T) => 
  z.object({
    body: bodySchema, // Your shared schema goes here
    query: z.object({}), // Default empty query params
    params: z.object({}), // Default empty route params
  });

export const validate =
  (schema: AnyZodObject) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          errors: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
      }
      return res.status(500).json({ message: 'Internal server error' });
    }
  };