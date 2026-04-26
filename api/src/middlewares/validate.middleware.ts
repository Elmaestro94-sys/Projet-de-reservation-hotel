import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { error } from '../utils/response';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return error(res, 'Données invalides', 400, result.error.flatten().fieldErrors);
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return error(res, 'Paramètres de requête invalides', 400, result.error.flatten().fieldErrors);
    }
    req.query = result.data as typeof req.query;
    next();
  };
}
