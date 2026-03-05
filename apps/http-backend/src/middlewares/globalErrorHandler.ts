import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";
import { ApiRes } from "../utils/ApiRes.js";

export const globalErrorHandler = (err, req: Request, res: Response, next: NextFunction) => {
  if (!(err instanceof ApiError)) {
    return res.status(500).json(new ApiRes(
      500,
      err.message,
      null
    ))
  }
  return res.status(err.statusCode).json(new ApiRes(
    err.statusCode,
    err.message,
    null
  ))
}
