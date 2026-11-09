import { NextFunction, Request, Response } from 'express';

type AsyncHandlerFn = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/** Wrap async route handlers – forwards rejections to the central error handler. */
const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await Promise.resolve(fn(req, res, next)).catch(next);
  };

export { asyncHandler };
export default asyncHandler;
