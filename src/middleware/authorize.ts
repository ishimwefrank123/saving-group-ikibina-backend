
import type { RequestHandler } from "express";
import { ApiError } from "../utils/ApiError.js";

export const requirePlatformAdmin: RequestHandler = (
  req,
  _res,
  next
) => {
  if (!req.user) {
    return next(new ApiError(401, "Authentication required"));
  }

  if (req.user.platformRole !== "platform-admin") {
    return next(
      new ApiError(403, "Platform admin access required")
    );
  }

  next();
};
