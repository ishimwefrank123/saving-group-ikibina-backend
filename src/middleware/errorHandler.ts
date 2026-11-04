
import type {
  ErrorRequestHandler,
  RequestHandler
} from "express";
import mongoose from "mongoose";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError";

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found"
  });
};

export const errorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next
) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: error.issues
    });
    return;
  }

  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message
    });
    return;
  }

  if (error instanceof mongoose.Error.ValidationError) {
    res.status(400).json({
      success: false,
      message: error.message
    });
    return;
  }

  if ((error as { code?: number }).code === 11000) {
    res.status(409).json({
      success: false,
      message: "A record with this value already exists"
    });
    return;
  }

  if (
    error instanceof Error &&
    error.name === "JsonWebTokenError"
  ) {
    res.status(401).json({
      success: false,
      message: "Invalid authentication token"
    });
    return;
  }

  console.error(error);

  res.status(500).json({
    success: false,
    message: "Internal server error"
  });
};
