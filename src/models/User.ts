import mongoose, {Schema, type Document} from "mongoose";

export type PlatformRole = "user" | "platform-admin";
export type AccountStatus = "active" | "blocked";

export interface IUser extends Document{
    name: string;
    email: string;
    password: string;
    platformRole: PlatformRole;
    status: AccountStatus;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUser> (
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 100
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        password: {
            type: String,
            required: true,
            select: false
        },
        platformRole:{
            type: String,
            enum: ["user","platform-admin"],
            default: "user"
        },
        status:{
            type: String,
            enum: ["active" , "blocked"],
            default: "active",
        }
    },
    {timestamps: true}

);

export const User = mongoose.model<IUser>("User", userSchema)