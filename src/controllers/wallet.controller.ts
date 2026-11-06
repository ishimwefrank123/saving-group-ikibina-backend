import type { NextFunction, Request, Response } from "express";

import walletService from "../services/wallet.service.js";

export const getMyWallet = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const wallet = await walletService.getMyWallet(req.user!.id.toString());

    res.status(200).json({
      success: true,
      message: "Wallet retrieved successfully.",
      data: wallet
    });
  } catch (error) {
    next(error);
  }
};

export const getWalletBalance = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const balance = await walletService.getWalletBalance(req.user!.id.toString());

    res.status(200).json({
      success: true,
      message: "Wallet balance retrieved successfully.",
      data: balance
    });
  } catch (error) {
    next(error);
  }
};

export const topUpWallet = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { amount, description } = req.body;

    if (
      typeof amount !== "number" ||
      (description !== undefined && typeof description !== "string")
    ) {
      res.status(400).json({
        success: false,
        message: "Please provide a valid amount and description."
      });
      return;
    }

    const idempotencyKey = req.headers["idempotency-key"];

    if (
      idempotencyKey !== undefined &&
      typeof idempotencyKey !== "string"
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid idempotency key."
      });
      return;
    }

    const result = await walletService.topUpWallet(
      req.user!.id.toString(),
      { amount, description, idempotencyKey }
    );

    res.status(200).json({
      success: true,
      message: "Simulated top-up completed successfully.",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const withdrawFromWallet = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { amount, description } = req.body;

    if (
      typeof amount !== "number" ||
      (description !== undefined && typeof description !== "string")
    ) {
      res.status(400).json({
        success: false,
        message: "Please provide a valid amount and description."
      });
      return;
    }

    const idempotencyKey = req.headers["idempotency-key"];

    if (
      idempotencyKey !== undefined &&
      typeof idempotencyKey !== "string"
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid idempotency key."
      });
      return;
    }

    const result = await walletService.withdrawFromWallet(
      req.user!.id.toString(),
      { amount, description, idempotencyKey }
    );

    res.status(200).json({
      success: true,
      message: "Withdrawal completed successfully.",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getTransactionHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const result = await walletService.getTransactionHistory(
      req.user!.id.toString(),
      page,
      limit
    );

    res.status(200).json({
      success: true,
      message: "Transaction history retrieved successfully.",
      data: result.transactions,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};