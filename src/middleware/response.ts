import {NextFunction, Request, Response} from "express";

export const middlewareResponse: (req: Request, res: Response, next: NextFunction) => void = (req, res, next) => {
  res.locals.response = {
    data: null,
    msg: '',
    isError: false,
  };
  next();
};