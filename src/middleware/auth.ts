import { NextFunction, Request, Response } from "express";
import "../config/dotenv";
import * as jwt from "jsonwebtoken";

export const auth = async (req: Request, res: Response, next: NextFunction) => {
   const header = req.headers.authorization;
   if (!header) return res.status(401).json({ message: "Token is requred!" });
   const [, token] = header.split(" ");
   try {
      jwt.verify(token, "BichoCorps" as string);
      next();
   } catch (error) {
      return res.status(401).json({ error: "Token is invalid!" });
   }
};
