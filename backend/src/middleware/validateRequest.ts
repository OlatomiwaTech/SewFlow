import type { NextFunction, Request, Response } from "express";
import { z, type ZodTypeAny } from "zod";

type ValidationTargets = {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
};

export function validateRequest({ body, query, params }: ValidationTargets) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (body) {
        req.body = body.parse(req.body);
      }

      if (query) {
        req.query = query.parse(req.query);
      }

      if (params) {
        req.params = params.parse(req.params);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function strictObject<T extends z.ZodRawShape>(schema: z.ZodObject<T>) {
  return schema.strict();
}