import mongoose, { Document, Schema } from "mongoose";

export interface IIssue extends Document {
    reportedBy: mongoose.Types.ObjectId;
    group: mongoose.Types.ObjectId;
    subject: string;
    description: string;
    status: "open" | "in-review" | "resolved" | "dismissed";
    adminNote?: string;
    resolvedBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const issueSchema = new Schema<IIssue>(
    {
        reportedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        group: {
            type: Schema.Types.ObjectId,
            ref: "Group",
            required: true
        },
        subject: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120
        },
        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 3000
        },
        status: {
            type: String,
            enum: ["open","in-review","resolved","dismissed"],
            default: "open"
        },
        adminNote: {
            type: String,
            trim: true,
            maxlength: 2000
        },
        resolvedBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {timestamps: true}
);

export const Issue = mongoose.model<IIssue>("Issue",issueSchema);