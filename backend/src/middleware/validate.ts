import { NextFunction, Request, Response } from "express";
import { ZodError, ZodTypeAny } from "zod";
import { sendError } from "../utils/http";

type ValidateInput = {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
};

export const validate = (schemas: ValidateInput) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return sendError(
          res,
          "Validation failed",
          400,
          error.errors.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        );
      }
      next(error);
    }
  };
};
