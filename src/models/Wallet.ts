import mongoose, { Schema, type Document } from "mongoose";

export interface IWallet extends Document {
  owner: mongoose.Types.ObjectId;
  group?: mongoose.Types.ObjectId;
  balance: number;
  currency: string;
  status: "ACTIVE" | "FROZEN";
  createdAt: Date;
  updatedAt: Date;
}

const walletSchema = new Schema<IWallet>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    group: {
      type: Schema.Types.ObjectId,
      ref: "Group",
    },
    balance: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    currency: {
      type: String,
      required: true,
      default: "RWF",
      uppercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "FROZEN"],
      required: true,
      default: "ACTIVE",
    },
  },
  { timestamps: true }
);

walletSchema.index(
  { owner: 1 },
  { unique: true, partialFilterExpression: { group: { $exists: false } } }
);
walletSchema.index(
  { owner: 1, group: 1 },
  { unique: true, partialFilterExpression: { group: { $exists: true } } }
);

export const Wallet = mongoose.model<IWallet>("Wallet", walletSchema);
