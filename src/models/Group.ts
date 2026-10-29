import mongoose, { Document } from "mongoose";
import { maxLength, minLength, string } from "zod";

export interface IGroup extends Document{
    name: string;
    description?: string;
    inviteCode: string;
    createdBy: mongoose.Types.ObjectId;
    contributionAmount: number;
    contributionFrequency: "weekly" | "monthly";
    loanInterestRate: number;
    maxLoanAmount: number;
    status: "active" | "frozen";
    freezeReason?: string;
    createdAt: Date;
    updatedAt: Date;
}

const groupSchema = new Schema<IGroup>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minLength: 2,
            maxLength: 100,
        },
        description: {
            type: String,
            trim: true,
            maxLength: 500
        },
        inviteCode: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        contributionAmount: {
            type: Number,
            required: true,
            min: 0
        },
        contributionFrequency: {
            type: String,
            enum: ["weekly","monthly"],
            required: true
        },
        loanInterestRate: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        },
        maxLoanAmount: {
            type: Number,
            required: true,
            min: 0
        },
        status: {
            type: String,
            enum: ["active","frozen"],
            default: "acitve"
        },
        freezeReason: {
            type: String,
            trim: true,
            maxLength: 500
        }
    },
    {timestamps: true}
);

export const Group = mongoose.model<IGroup>("Group", groupSchema)