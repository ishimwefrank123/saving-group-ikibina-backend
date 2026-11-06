import mongoose from "mongoose";
import { randomUUID } from "crypto";

import { Wallet } from "../models/Wallet.js";
import LedgerEntry from "../models/ledgerEntry.js";

class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "AppError";
  }
}

type TransactionType = "TOP_UP" | "WITHDRAWAL";

interface MoneyInput {
  amount: number;
  description?: string;
  idempotencyKey?: string;
}

const validateAmount = (amount: number): void => {
  // RWF amounts are stored as whole numbers in this project.
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new AppError(
      "Amount must be a positive whole number.",
      400
    );
  }
};

const validateIdempotencyKey = (key?: string): void => {
  if (
    key !== undefined &&
    (typeof key !== "string" || key.length < 8 || key.length > 100)
  ) {
    throw new AppError(
      "Idempotency key must contain between 8 and 100 characters.",
      400
    );
  }
};

const getOrCreateWallet = async (userId: string) => {
  let wallet = await Wallet.findOne({
    owner: userId,
    group: { $exists: false }
  });

  if (!wallet) {
    try {
      wallet = await Wallet.create({
        owner: userId,
        balance: 0,
        currency: "RWF",
        status: "ACTIVE"
      });
    } catch (error) {
      // Another request may have created the wallet at the same time.
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === 11000
      ) {
        wallet = await Wallet.findOne({
          owner: userId,
          group: { $exists: false }
        });
      } else {
        throw error;
      }
    }
  }

  if (!wallet) {
    throw new AppError("Could not create or retrieve wallet.", 500);
  }

  return wallet;
};

const getMyWallet = async (userId: string) => {
  return getOrCreateWallet(userId);
};

const getWalletBalance = async (userId: string) => {
  const wallet = await getOrCreateWallet(userId);

  return {
    walletId: wallet._id,
    balance: wallet.balance,
    currency: wallet.currency,
    status: wallet.status
  };
};

const processTransaction = async (
  userId: string,
  data: MoneyInput,
  type: TransactionType
) => {
  const { amount, description, idempotencyKey } = data;

  validateAmount(amount);
  validateIdempotencyKey(idempotencyKey);

  const reference = idempotencyKey || randomUUID();

  // A MongoDB transaction keeps the balance update and ledger entry together.
  const session = await mongoose.startSession();

  let result:
    | {
        wallet: mongoose.HydratedDocument<unknown>;
        ledgerEntry: mongoose.HydratedDocument<unknown>;
      }
    | undefined;

  try {
    await session.withTransaction(async () => {
      const wallet = await Wallet.findOne({
        owner: userId,
        group: { $exists: false }
      }).session(session);

      if (!wallet) {
        throw new AppError(
          "Wallet not found. Retrieve your wallet first.",
          404
        );
      }

      if (wallet.status !== "ACTIVE") {
        throw new AppError("Your wallet is frozen.", 403);
      }

      const balanceBefore = wallet.balance;

      let updatedWallet;

      if (type === "TOP_UP") {
        updatedWallet = await Wallet.findOneAndUpdate(
          {
            _id: wallet._id,
            status: "ACTIVE"
          },
          {
            $inc: { balance: amount }
          },
          {
            new: true,
            session,
            runValidators: true
          }
        );
      } else {
        // The balance condition prevents the wallet from going below zero.
        updatedWallet = await Wallet.findOneAndUpdate(
          {
            _id: wallet._id,
            status: "ACTIVE",
            balance: { $gte: amount }
          },
          {
            $inc: { balance: -amount }
          },
          {
            new: true,
            session,
            runValidators: true
          }
        );

        if (!updatedWallet) {
          throw new AppError("Insufficient wallet balance.", 400);
        }
      }

      if (!updatedWallet) {
        throw new AppError(
          "Wallet could not be updated. Please try again.",
          409
        );
      }

      const balanceAfter = updatedWallet.balance;

      const [ledgerEntry] = await LedgerEntry.create(
        [
          {
            wallet: updatedWallet._id,
            user: userId,
            type,
            amount,
            balanceBefore,
            balanceAfter,
            description:
              description ||
              (type === "TOP_UP"
                ? "Simulated wallet top-up"
                : "Wallet withdrawal"),
            reference,
            status: "COMPLETED"
          }
        ],
        { session }
      );

      result = {
        wallet: updatedWallet,
        ledgerEntry
      };
    });

    if (!result) {
      throw new AppError("Transaction could not be completed.", 500);
    }

    return result;
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000
    ) {
      throw new AppError(
        "This transaction reference has already been used.",
        409
      );
    }

    throw error;
  } finally {
    await session.endSession();
  }
};

const topUpWallet = async (
  userId: string,
  data: MoneyInput
) => {
  return processTransaction(userId, data, "TOP_UP");
};

const withdrawFromWallet = async (
  userId: string,
  data: MoneyInput
) => {
  return processTransaction(userId, data, "WITHDRAWAL");
};

const getTransactionHistory = async (
  userId: string,
  page = 1,
  limit = 10
) => {
  const wallet = await getOrCreateWallet(userId);

  const currentPage = Math.max(1, page);
  const pageSize = Math.min(100, Math.max(1, limit));
  const skip = (currentPage - 1) * pageSize;

  const [transactions, totalTransactions] = await Promise.all([
    LedgerEntry.find({
      wallet: wallet._id,
      user: userId
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize),

    LedgerEntry.countDocuments({
      wallet: wallet._id,
      user: userId
    })
  ]);

  return {
    transactions,
    pagination: {
      totalTransactions,
      currentPage,
      pageSize,
      totalPages: Math.ceil(totalTransactions / pageSize)
    }
  };
};

export default {
  getMyWallet,
  getWalletBalance,
  topUpWallet,
  withdrawFromWallet,
  getTransactionHistory
};