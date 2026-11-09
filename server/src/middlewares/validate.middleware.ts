import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';
import { ApiError } from '../utils/ApiError';

export interface ValidateSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/** Zod validation wrapper for body/query/params. Replaces req with parsed output. */
export function validate(schemas: ValidateSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query) req.query = schemas.query.parse(req.query) as unknown as Request['query'];
      if (schemas.params) req.params = schemas.params.parse(req.params) as unknown as Request['params'];
      next();
    } catch (e) {
      next(new ApiError(400, 'Validation failed', (e as Error).message));
    }
  };
}

export default validate;
