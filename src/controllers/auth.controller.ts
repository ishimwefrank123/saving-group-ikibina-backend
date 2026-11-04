
import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import {
  loginUser,
  registerUser
} from "../services/auth.service";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128)
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(128)
});

export const register = asyncHandler(
  async (req: Request, res: Response) => {
    const input = registerSchema.parse(req.body);
    const result = await registerUser(input);

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: result
    });
  }
);

export const login = asyncHandler(
  async (req: Request, res: Response) => {
    const input = loginSchema.parse(req.body);
    const result = await loginUser(input);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result
    });
  }
);

export const me = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user!;

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        platformRole: user.platformRole,
        status: user.status
      }
    });
  }
);
