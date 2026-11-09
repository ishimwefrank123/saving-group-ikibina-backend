import type { Request, Response } from "express";
import z from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as ledgerService from "../services/ledger.service.js";
import { Membership } from "../models/Membership.js";
import { ApiError } from "../utils/ApiError.js";

const ledgerQuerySchema = z.object({
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
  search: z.string().optional(),
});

const reversalSchema = z.object({
  transactionId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid transaction ID"),
  reason: z.string().trim().min(5).max(500, "Reason must be 5 to 500 characters"),
});

/**
 * Get group pool balance and ledger transaction history.
 * "Each group's records are visible only to its own members and the platform admin."
 */
export const getGroupLedger = asyncHandler(
  async (req: Request, res: Response) => {
    const groupId = req.params.groupId as string;
    const isPlatformAdmin = req.user?.platformRole === "platform-admin";

    if (!isPlatformAdmin) {
      const membership = await Membership.findOne({
        user: req.user!.id,
        group: groupId,
        status: "active",
      });

      if (!membership) {
        throw new ApiError(
          403,
          "Group ledger records are visible only to active members of the group and platform admins"
        );
      }
    }

    const query = ledgerQuerySchema.parse(req.query);
    const result = await ledgerService.getGroupTransactionHistory(
      groupId,
      query
    );

    res.json({
      success: true,
      data: result,
    });
  }
);

/**
 * Create a reversing ledger transaction
 * "Records are never edited or deleted. A mistake is fixed with a new, reversing record that explains why."
 */
export const createReversal = asyncHandler(
  async (req: Request, res: Response) => {
    const input = reversalSchema.parse(req.body);

    const reversedTransaction = await ledgerService.createReversalTransaction(
      input.transactionId,
      req.user!.id,
      input.reason
    );

    res.status(201).json({
      success: true,
      message: "Transaction reversed successfully",
      data: reversedTransaction,
    });
  }
);

/**
 * System-wide ledger listing (platform admin only)
 */
export const getAllLedger = asyncHandler(
  async (req: Request, res: Response) => {
    const query = ledgerQuerySchema.parse(req.query);
    const result = await ledgerService.getAllLedgerTransactions(query);

    res.json({
      success: true,
      data: result,
    });
  }
);
