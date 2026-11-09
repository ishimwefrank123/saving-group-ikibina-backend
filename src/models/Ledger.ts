import mongoose, { Document, Schema } from "mongoose";

export type LedgerEntryType =
  | "top-up"
  | "withdrawal"
  | "contribution"
  | "loan-payout"
  | "loan-repayment"
  | "reversal";

export interface ILedger extends Document {
  _id: mongoose.Types.ObjectId;
  reference: string;
  type: LedgerEntryType;
  from: string;
  to: string;
  amount: number;
  currency: string;
  performedBy: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;
  group?: mongoose.Types.ObjectId;
  description: string;
  metadata?: {
    phoneNumber?: string;
    provider?: string;
    simulated?: boolean;
    [key: string]: unknown;
  };
  reversalOf?: mongoose.Types.ObjectId;
  reversalReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ledgerSchema = new Schema<ILedger>(
  {
    reference: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        "top-up",
        "withdrawal",
        "contribution",
        "loan-payout",
        "loan-repayment",
        "reversal",
      ],
      required: true,
      index: true,
    },
    from: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    to: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [1, "Amount must be at least 1 RWF"],
    },
    currency: {
      type: String,
      default: "RWF",
      uppercase: true,
      trim: true,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    group: {
      type: Schema.Types.ObjectId,
      ref: "Group",
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    reversalOf: {
      type: Schema.Types.ObjectId,
      ref: "Ledger",
      default: null,
    },
    reversalReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast lookup of balances and transaction histories
ledgerSchema.index({ from: 1, createdAt: -1 });
ledgerSchema.index({ to: 1, createdAt: -1 });
ledgerSchema.index({ user: 1, createdAt: -1 });
ledgerSchema.index({ group: 1, createdAt: -1 });

// Money rule: "Records are never edited or deleted. A mistake is fixed with a new, reversing record that explains why."
function preventMutation(next: (err?: Error) => void) {
  next(
    new Error(
      "Financial ledger records are immutable and cannot be updated or deleted. Create a reversing record instead."
    )
  );
}

ledgerSchema.pre(/(updateOne|updateMany|findOneAndUpdate|deleteOne|deleteMany|findOneAndDelete)/, preventMutation);

export const Ledger = mongoose.model<ILedger>("Ledger", ledgerSchema);
