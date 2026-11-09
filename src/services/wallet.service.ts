import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import {
  calculateWalletBalance,
  recordTransaction,
  getUserTransactionHistory,
} from "./ledger.service.js";

export interface TopUpInput {
  amount: number;
  phoneNumber?: string;
  provider?: "MTN" | "AIRTEL" | string;
}

export interface WithdrawInput {
  amount: number;
  phoneNumber: string;
  provider?: "MTN" | "AIRTEL" | string;
}

/**
 * Returns wallet summary for a member: current balance and recent transactions
 */
export async function getWalletSummary(userId: string) {
  const user = await User.findById(userId).select("name email status");
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const [balance, history] = await Promise.all([
    calculateWalletBalance(userId),
    getUserTransactionHistory(userId, { limit: 5 }),
  ]);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      status: user.status,
    },
    balance,
    currency: "RWF",
    recentTransactions: history.transactions,
  };
}

/**
 * Simulates a mobile money wallet top-up
 * "Practice money only... wallet top-ups and withdrawals are simulated"
 */
export async function topUpWallet(userId: string, input: TopUpInput) {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.status !== "active") {
    throw new ApiError(403, "Your account is blocked and cannot perform top-ups");
  }

  if (input.amount <= 0) {
    throw new ApiError(400, "Top-up amount must be greater than 0");
  }

  const provider = input.provider || "MTN";
  const phone = input.phoneNumber || "Simulated Wallet Screen";

  const transaction = await recordTransaction({
    type: "top-up",
    from: "external",
    to: `wallet:${userId}`,
    amount: input.amount,
    performedBy: userId,
    user: userId,
    description: `Simulated ${provider} top-up from ${phone}`,
    metadata: {
      phoneNumber: input.phoneNumber,
      provider,
      simulated: true,
    },
  });

  const newBalance = await calculateWalletBalance(userId);

  return {
    transaction,
    newBalance,
    currency: "RWF",
  };
}

/**
 * Simulates a mobile money wallet withdrawal
 * Enforces rule: No transfer can make a wallet go below zero.
 */
export async function withdrawFromWallet(userId: string, input: WithdrawInput) {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.status !== "active") {
    throw new ApiError(403, "Your account is blocked and cannot withdraw funds");
  }

  if (input.amount <= 0) {
    throw new ApiError(400, "Withdrawal amount must be greater than 0");
  }

  const provider = input.provider || "MTN";

  const transaction = await recordTransaction({
    type: "withdrawal",
    from: `wallet:${userId}`,
    to: "external",
    amount: input.amount,
    performedBy: userId,
    user: userId,
    description: `Simulated ${provider} withdrawal to ${input.phoneNumber}`,
    metadata: {
      phoneNumber: input.phoneNumber,
      provider,
      simulated: true,
    },
  });

  const newBalance = await calculateWalletBalance(userId);

  return {
    transaction,
    newBalance,
    currency: "RWF",
  };
}
