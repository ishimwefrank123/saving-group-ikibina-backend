import mongoose, { Document, Schema } from "mongoose";

export interface LedgerEntry extends Document {
  wallet: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  group?: mongoose.Types.ObjectId;

  type:
    | "TOP_UP"
    | "WITHDRAWAL"
    | "CONTRIBUTION"
    | "LOAN_DISBURSEMENT"
    | "LOAN_REPAYMENT";

  amount: number;
  balanceBefore: number;
  balanceAfter: number;

  description?: string;

  reference?: string;

  status: "COMPLETED" | "REVERSED";
  createdAt: Date;
  updatedAt: Date;
}

const ledgerEntrySchema = new Schema<LedgerEntry>(
  {
    wallet: {
      type: Schema.Types.ObjectId,
      ref: "Wallet",
      required: true
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    group: {
      type: Schema.Types.ObjectId,
      ref: "Group"
    },

    type: {
      type: String,
      enum: [
        "TOP_UP",
        "WITHDRAWAL",
        "CONTRIBUTION",
        "LOAN_DISBURSEMENT",
        "LOAN_REPAYMENT"
      ],
      required: true
    },

    amount: {
      type: Number,
      required: true,
      min: 0.01
    },

    balanceBefore: {
      type: Number,
      required: true,
      min: 0
    },

    balanceAfter: {
      type: Number,
      required: true,
      min: 0
    },

    description: {
      type: String,
      trim: true
    },

    reference: {
      type: String,
      unique: true,
      sparse: true
    },

    status: {
      type: String,
      enum: ["COMPLETED", "REVERSED"],
      default: "COMPLETED"
    }
  },
  {
    timestamps: true
  }
);

ledgerEntrySchema.index({ wallet: 1, createdAt: -1 });
ledgerEntrySchema.index({ user: 1, createdAt: -1 });

const LedgerEntry = mongoose.model<LedgerEntry>(
  "LedgerEntry",
  ledgerEntrySchema
);

export default LedgerEntry;