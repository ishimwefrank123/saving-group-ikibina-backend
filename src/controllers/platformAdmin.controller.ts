import type { Request,Response } from "express";
import z from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as service from "../services/platformAdmin.service.js";

export const dashboard = asyncHandler(
    async (_req: Request, res: Response) => {
        res.json({
            success: true,
            data: await service.dashboard()
        });
    }
);

export const users = asyncHandler(
    async(_req: Request, res: Response) => {
        res.json({
            success: true,
            data: await service.listUsers()
        })
    }
)

export const groups = asyncHandler(
    async(_req: Request, res: Response) => {
        res.json({
            success: true,
            data: await service.listGroups()
        })
    }
)

export const issues = asyncHandler(
    async(_req: Request, res: Response)=> {
        res.json({
            success: true,
            data: await service.listIssues()
        })
    }
)

export const userStatus = asyncHandler(
    async (req: Request, res: Response) => {
        const input = z.object({
            status: z.enum(["active","blocked"])
        }).parse(req.body);

        const user = await service.setUserStatus(
            req.user!.id,
            req.params.userId as string,
            input.status
        );

        res.json({success: true, data: user});
    }
);

export const groupStatus = asyncHandler(
    async (req: Request, res: Response) => {
        const input = z.object({
            status: z.enum(["active","frozen"]),
            reason: z.string().trim().max(500).optional()
        }).parse(req.body);

        if(input.status==="frozen" && !input.reason){
            res.status(400).json({
                success: false,
                message: "A reason is required when freezing a group"
            });
            return
        }
        const group = await service.setGroupStatus(
            req.params.groupId as string,
            input.status,
            input.reason
        );
        res.json({success: true, data: group});
    }
)

export const updateIssue = asyncHandler(
    async (req: Request, res: Response) => {
        const input = z.object({
            status: z.enum([
                "open",
                "in-review",
                "resolved",
                "dismissed"
            ]),
            adminNote: z.string().trim().max(2000).optional()
        }).parse(req.body);

        const issue = await service.updateIssue(
            req.params.issueId as string,
            req.user!.id,
            input
        );
        res.json({success: true, data: issue});
    }
)