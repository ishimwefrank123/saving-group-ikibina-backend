import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import mongoose from "mongoose";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authorization = req.header("authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!token) {
    res.status(401).json({ success: false, message: "Authentication required" });
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("JWT_SECRET is not configured");
    res.status(500).json({ success: false, message: "Authentication unavailable" });
    return;
  }

  try {
    const payload = jwt.verify(token, secret);
    const userId =
      typeof payload === "object" && payload !== null
        ? (payload as JwtPayload).sub
        : undefined;

    if (typeof userId !== "string" || !mongoose.isValidObjectId(userId)) {
      res.status(401).json({ success: false, message: "Invalid authentication token" });
      return;
    }

    req.user = { id: new mongoose.Types.ObjectId(userId) };
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid or expired authentication token" });
  }
};