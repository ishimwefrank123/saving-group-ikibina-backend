import type { Request, Response } from "express";
import z from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as walletService from "../services/wallet.service.js";
import { getUserTransactionHistory } from "../services/ledger.service.js";

const topUpSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  phoneNumber: z.string().trim().min(8).max(15).optional(),
  provider: z.enum(["MTN", "AIRTEL", "OTHER"]).optional(),
});

const withdrawSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  phoneNumber: z.string().trim().min(8).max(15),
  provider: z.enum(["MTN", "AIRTEL", "OTHER"]).optional(),
});

const historyQuerySchema = z.object({
  type: z
    .enum([
      "top-up",
      "withdrawal",
      "contribution",
      "loan-payout",
      "loan-repayment",
      "reversal",
    ])
    .optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const getSummary = asyncHandler(async (req: Request, res: Response) => {
  const result = await walletService.getWalletSummary(req.user!.id);
  res.json({
    success: true,
    data: result,
  });
});

export const topUp = asyncHandler(async (req: Request, res: Response) => {
  const input = topUpSchema.parse(req.body);
  const result = await walletService.topUpWallet(req.user!.id, input);

  res.status(201).json({
    success: true,
    message: "Wallet topped up successfully (simulated)",
    data: result,
  });
});

export const withdraw = asyncHandler(async (req: Request, res: Response) => {
  const input = withdrawSchema.parse(req.body);
  const result = await walletService.withdrawFromWallet(req.user!.id, input);

  res.status(200).json({
    success: true,
    message: "Wallet withdrawal processed successfully (simulated)",
    data: result,
  });
});

export const getTransactions = asyncHandler(
  async (req: Request, res: Response) => {
    const query = historyQuerySchema.parse(req.query);
    const result = await getUserTransactionHistory(req.user!.id, query);

    res.json({
      success: true,
      data: result,
    });
  }
);
