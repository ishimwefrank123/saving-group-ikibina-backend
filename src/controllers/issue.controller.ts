import type {Request, Response} from "express";
import z from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createIssue } from "../services/issue.service.js";

export const create = asyncHandler(
    async (req: Request, res: Response) => {
        const input = z.object({
            groupId: z.string().regex(/^[a-f\d]{24}$/i),
            subject: z.string().trim().min(3).max(120),
            description: z.string().trim().min(10).max(3000)
        }).parse(req.body);

        const issue = await createIssue(
            req.user!.id,
            input
        );

        res.status(201).json({
            success: true,
            message: "Issue reported successfully",
            data: issue
        });
    }
);