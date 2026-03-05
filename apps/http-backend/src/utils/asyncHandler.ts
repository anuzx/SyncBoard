import { NextFunction, Request, RequestHandler, Response } from "express"

export const asyncHandler = (reqHandler: RequestHandler) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await reqHandler(req, res, next)
    } catch (error) {
      next(error)
    }
  }
}
