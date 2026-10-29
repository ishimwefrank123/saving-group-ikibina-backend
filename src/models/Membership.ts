import mongoose, { Document, Schema } from "mongoose";

export interface IMembership extends Document{
    user: mongoose.Types.ObjectId;
    group: mongoose.Types.ObjectId;
    role: "member" | "group-admin";
    status: "active" | "removed";
    joinedAt: Date;
}

const membershipShcema = new Schema<IMembership>({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    group: {
        type: Schema.Types.ObjectId,
        ref: "Group",
        required: true
    },
    role: {
        type: String,
        enum: ["member","group-admin"],
        default: "member"
    },
    status: {
        type: String,
        enum: ["active","removed"],
        default: "active"
    },
    joinedAt: {
        type: Date,
        default: Date.now
    }
},{timestamps:true});


//A user can have only one membership record per group
membershipShcema.index(
    {user: 1, group: 1},
    {unique: true}
);

export const Membership = mongoose.model<IMembership>("Membership",membershipShcema);