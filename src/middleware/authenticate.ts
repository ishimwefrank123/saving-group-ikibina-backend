
import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { ApiError } from "../utils/ApiError";

interface TokenPayload {
  userId: string;
}

export const authenticate: RequestHandler = async (
  req,
  _res,
  next
) => {
  try {
    const header = req.headers.authorization;

    if (!header?.startsWith("Bearer ")) {
      throw new ApiError(401, "Authentication required");
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT_SECRET is not configured");
    }

    const token = header.slice(7);
    const payload = jwt.verify(token, secret) as TokenPayload;

    const user = await User.findById(payload.userId);

    if (!user) {
      throw new ApiError(401, "User account not found");
    }

    if (user.status !== "active") {
      throw new ApiError(403, "This account is blocked");
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
