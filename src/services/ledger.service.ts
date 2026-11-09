import mongoose, { ClientSession } from "mongoose";
import { Ledger, ILedger, LedgerEntryType } from "../models/Ledger.js";
import { Group } from "../models/Group.js";
import { ApiError } from "../utils/ApiError.js";
import { generateTransactionReference } from "../utils/generateReference.js";

export interface RecordTransactionInput {
  type: LedgerEntryType;
  from: string;
  to: string;
  amount: number;
  performedBy: string;
  user?: string;
  group?: string;
  description: string;
  metadata?: Record<string, unknown>;
  reversalOf?: string;
  reversalReason?: string;
}

export interface TransactionHistoryQuery {
  type?: LedgerEntryType;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

/**
 * Calculates current wallet balance directly from ledger entries
 * "Balances are calculated from the ledger and never edited by hand"
 */
export async function calculateWalletBalance(
  userId: string,
  session?: ClientSession
): Promise<number> {
  const userWallet = `wallet:${userId}`;

  const pipeline: mongoose.PipelineStage[] = [
    {
      $match: {
        $or: [{ to: userWallet }, { from: userWallet }],
      },
    },
    {
      $group: {
        _id: null,
        balance: {
          $sum: {
            $cond: [
              { $eq: ["$to", userWallet] },
              "$amount",
              { $multiply: ["$amount", -1] },
            ],
          },
        },
      },
    },
  ];

  const result = session
    ? await Ledger.aggregate<{ balance: number }>(pipeline).session(session)
    : await Ledger.aggregate<{ balance: number }>(pipeline);

  return result[0]?.balance ?? 0;
}

/**
 * Calculates current group pool balance directly from ledger entries
 */
export async function calculateGroupPoolBalance(
  groupId: string,
  session?: ClientSession
): Promise<number> {
  const groupPool = `group:${groupId}`;

  const pipeline: mongoose.PipelineStage[] = [
    {
      $match: {
        $or: [{ to: groupPool }, { from: groupPool }],
      },
    },
    {
      $group: {
        _id: null,
        balance: {
          $sum: {
            $cond: [
              { $eq: ["$to", groupPool] },
              "$amount",
              { $multiply: ["$amount", -1] },
            ],
          },
        },
      },
    },
  ];

  const result = session
    ? await Ledger.aggregate<{ balance: number }>(pipeline).session(session)
    : await Ledger.aggregate<{ balance: number }>(pipeline);

  return result[0]?.balance ?? 0;
}

/**
 * Executes an operation within a MongoDB transaction if replica set transactions are supported,
 * otherwise falls back gracefully to direct execution (for local standalone MongoDB).
 */
async function executeWithTransaction<T>(
  callback: (session?: ClientSession) => Promise<T>,
  existingSession?: ClientSession
): Promise<T> {
  if (existingSession) {
    return callback(existingSession);
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await callback(session);
    await session.commitTransaction();
    return result;
  } catch (err: any) {
    await session.abortTransaction().catch(() => {});
    const errStr = `${err?.message || ""} ${err?.errorResponse?.errmsg || ""} ${err?.originalError?.message || ""}`;
    if (
      err?.code === 20 ||
      err?.originalError?.code === 20 ||
      errStr.includes("replica set") ||
      errStr.includes("retryable writes") ||
      errStr.includes("Transaction numbers")
    ) {
      return callback();
    }
    throw err;
  } finally {
    session.endSession();
  }
}

/**
 * Records a movement in the ledger.
 * Enforces money rule:
 * "No transfer can make a wallet or the group pool go below zero."
 * "Each transfer is saved in a database transaction, so money is never taken from one place without arriving in the other."
 */
export async function recordTransaction(
  input: RecordTransactionInput,
  externalSession?: ClientSession
): Promise<ILedger> {
  if (input.amount <= 0) {
    throw new ApiError(400, "Transaction amount must be strictly greater than 0");
  }

  return executeWithTransaction(async (session) => {
    const sessionOpt = session ? { session } : undefined;

    // 1. Balance check if deducting from a user wallet
    if (input.from.startsWith("wallet:")) {
      const sourceUserId = input.from.replace("wallet:", "");
      const currentBalance = await calculateWalletBalance(sourceUserId, session);

      if (currentBalance < input.amount) {
        throw new ApiError(
          400,
          `Insufficient funds in wallet. Current balance: ${currentBalance} RWF, attempted: ${input.amount} RWF`
        );
      }
    }

    // 2. Balance check if deducting from a group pool
    if (input.from.startsWith("group:")) {
      const sourceGroupId = input.from.replace("group:", "");
      const currentPool = await calculateGroupPoolBalance(sourceGroupId, session);

      if (currentPool < input.amount) {
        throw new ApiError(
          400,
          `Insufficient funds in group pool. Current pool balance: ${currentPool} RWF, attempted: ${input.amount} RWF`
        );
      }
    }

    // 3. Create unique reference
    const reference = generateTransactionReference();

    // 4. Create ledger record
    const [createdLedger] = await Ledger.create(
      [
        {
          reference,
          type: input.type,
          from: input.from,
          to: input.to,
          amount: input.amount,
          currency: "RWF",
          performedBy: input.performedBy,
          user: input.user,
          group: input.group,
          description: input.description,
          metadata: input.metadata || {},
          reversalOf: input.reversalOf,
          reversalReason: input.reversalReason,
        },
      ],
      sessionOpt
    );

    // 5. Keep cached Group poolBalance in sync if a group was affected
    if (input.group) {
      const updatedPool = await calculateGroupPoolBalance(input.group, session);
      await Group.findByIdAndUpdate(
        input.group,
        { poolBalance: updatedPool },
        sessionOpt
      );
    }

    return createdLedger;
  }, externalSession);
}

/**
 * Reverses a ledger record.
 * "Records are never edited or deleted. A mistake is fixed with a new, reversing record that explains why."
 */
export async function createReversalTransaction(
  originalLedgerId: string,
  actorId: string,
  reason: string
): Promise<ILedger> {
  if (!reason || reason.trim().length === 0) {
    throw new ApiError(400, "A reason is mandatory when reversing a transaction");
  }

  return executeWithTransaction(async (session) => {
    const original = session
      ? await Ledger.findById(originalLedgerId).session(session)
      : await Ledger.findById(originalLedgerId);

    if (!original) {
      throw new ApiError(404, "Original transaction not found");
    }

    if (original.type === "reversal") {
      throw new ApiError(400, "Cannot reverse a reversal transaction");
    }

    const existingReversal = session
      ? await Ledger.findOne({ reversalOf: original._id }).session(session)
      : await Ledger.findOne({ reversalOf: original._id });

    if (existingReversal) {
      throw new ApiError(
        400,
        `Transaction has already been reversed under reference ${existingReversal.reference}`
      );
    }

    return recordTransaction(
      {
        type: "reversal",
        from: original.to,
        to: original.from,
        amount: original.amount,
        performedBy: actorId,
        user: original.user?.toString(),
        group: original.group?.toString(),
        description: `Reversal of ${original.reference}: ${reason.trim()}`,
        reversalOf: original._id.toString(),
        reversalReason: reason.trim(),
        metadata: {
          originalReference: original.reference,
          originalType: original.type,
        },
      },
      session
    );
  });
}

/**
 * Get personal transaction history for a member
 */
export async function getUserTransactionHistory(
  userId: string,
  query: TransactionHistoryQuery = {}
) {
  const userWallet = `wallet:${userId}`;
  const filter: Record<string, unknown> = {
    $or: [{ to: userWallet }, { from: userWallet }],
  };

  if (query.type) {
    filter.type = query.type;
  }

  if (query.startDate || query.endDate) {
    const dateFilter: Record<string, Date> = {};
    if (query.startDate) dateFilter.$gte = new Date(query.startDate);
    if (query.endDate) dateFilter.$lte = new Date(query.endDate);
    filter.createdAt = dateFilter;
  }

  const page = Math.max(1, query.page || 1);
  const limit = Math.min(100, Math.max(1, query.limit || 20));
  const skip = (page - 1) * limit;

  const [transactions, total, currentBalance] = await Promise.all([
    Ledger.find(filter)
      .populate("performedBy", "name email")
      .populate("group", "name inviteCode")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Ledger.countDocuments(filter),
    calculateWalletBalance(userId),
  ]);

  return {
    balance: currentBalance,
    currency: "RWF",
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
    transactions,
  };
}

/**
 * Get group pool ledger transaction history
 */
export async function getGroupTransactionHistory(
  groupId: string,
  query: TransactionHistoryQuery = {}
) {
  const groupPool = `group:${groupId}`;
  const filter: Record<string, unknown> = {
    $or: [{ to: groupPool }, { from: groupPool }, { group: groupId }],
  };

  if (query.type) {
    filter.type = query.type;
  }

  if (query.startDate || query.endDate) {
    const dateFilter: Record<string, Date> = {};
    if (query.startDate) dateFilter.$gte = new Date(query.startDate);
    if (query.endDate) dateFilter.$lte = new Date(query.endDate);
    filter.createdAt = dateFilter;
  }

  const page = Math.max(1, query.page || 1);
  const limit = Math.min(100, Math.max(1, query.limit || 20));
  const skip = (page - 1) * limit;

  const [transactions, total, currentPoolBalance] = await Promise.all([
    Ledger.find(filter)
      .populate("performedBy", "name email")
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Ledger.countDocuments(filter),
    calculateGroupPoolBalance(groupId),
  ]);

  return {
    poolBalance: currentPoolBalance,
    currency: "RWF",
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
    transactions,
  };
}

/**
 * System-wide ledger listing for platform admin
 */
export async function getAllLedgerTransactions(
  query: TransactionHistoryQuery & { search?: string } = {}
) {
  const filter: Record<string, unknown> = {};

  if (query.type) {
    filter.type = query.type;
  }

  if (query.search) {
    const regex = new RegExp(query.search.trim(), "i");
    filter.$or = [{ reference: regex }, { description: regex }];
  }

  if (query.startDate || query.endDate) {
    const dateFilter: Record<string, Date> = {};
    if (query.startDate) dateFilter.$gte = new Date(query.startDate);
    if (query.endDate) dateFilter.$lte = new Date(query.endDate);
    filter.createdAt = dateFilter;
  }

  const page = Math.max(1, query.page || 1);
  const limit = Math.min(100, Math.max(1, query.limit || 20));
  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    Ledger.find(filter)
      .populate("performedBy", "name email")
      .populate("user", "name email")
      .populate("group", "name inviteCode")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Ledger.countDocuments(filter),
  ]);

  return {
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
    transactions,
  };
}
