import type {Request, Response} from "express";
import z from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as service from "../services/platformAdmin.service.js";

export const dashboard = asyncHandler(async(_req: Request, res:Response)=>{
    const stats = await service.dashboard();
    res.json({
        success: true,
        data: stats,
    });
});

export const users = asyncHandler(async (req: Request, res: Response)=>{
    const query = z
    .object({
        search: z.string().optional(),
        status: z.enum(["active","blocked"]).optional(),
        platformRole: z.enum(["user","platform-admin"]).optional(),
    })
    .parse(req.query);

    const result = await service.listUsers(query);
    res.json({
        success: true,
        data: result,
    });
});

export const getUser = asyncHandler(async (req: Request, res: Response) => {
    const result = await service.getUserDetails(req.params.userId as string);
    res.json({
        success: true,
        data: result,
    });
});

export const userStatus = asyncHandler(async (req: Request, res: Response) => {
    const input = z 
    .object({
        status: z.enum(["active", "blocked"]),
        reason: z.string().trim().max(500).optional()
    })
    .parse(req.body);

    if(input.status === "blocked" && !input.reason){
        res.status(400).json({
            success: false,
            message: "A reason is required when bolcking an account",
        });
        return;
    }

    const user = await service.setUserStatus(
        req.user!.id,
        req.params.userId as string,
        input.status,
        input.reason
    );

    res.json({
        success: true,
        message: `User account has been ${input.status === "blocked" ? "blocked" : "activated"}`,
        data: user,
    });
});

export const groups = asyncHandler(async (req: Request, res: Response) => {
    const query = z
    .object({
        search: z.string().optional(),
        status: z.enum(["active","frozen"]).optional()
    })
    .parse(req.query);

    const result = await service.listGroups(query);
    res.json({
        success: true,
        data: result,
    });
});

export const getGroup =  asyncHandler(async (req: Request, res: Response) => {
    const result = await service.getGroupDetails(req.params.grougId as string);
    res.json({
        succes: true,
        data: result,
    });
});

export const groupStatus = asyncHandler(async (req: Requet, res: Response) => {
    const input = z
    .object({
        status: z.enum(["active","frozen"]),
        reason: z.string().trim().max(500).optional(),
    })
    .parse(req.body);

    if(input.status === "frozen" && !input.reason){
        res.status(400).json({
            success: false,
            message: "A reason is required when freezing a group",
        });
        return;
    }

    const group = await service.setGroupStatus(
        req.params.groupId as string,
        input.status,
        input.reason
    );

    res.json({
        success: true,
        message: `Group has been ${input.staus === "frozen" ? "frozen" : "activated"}`,
        data: group,
    });
});

export const issues = asyncHandler(async (req: Request, res: Response) => {
    const query = z 
    .object({
        status: z.enum(["open","in-review","resolved","dismissed"]).optional(),
        groupId: z.string().optional(),
    })
    .parse(req.query);

    const result = await service.listIssues(query);
    res.json({
        success: true,
        data: result,
    });
});

export const getIssue = asyncHandler(async (req: Request, res: Response) => {
    const result = await service.getIssueDetails(req.params.issueId as string);
    res.json({
        success: true,
        data: result,
    });
});

export const updateIssue = asyncHandler(async (req: Request, res: Response)=>{
    const input = z
    .object({
        status: z.enum(["open","in-review","resolved","dismissed"]),
        adminNote: z.string().trim().max(2000).optional(),
    })
    .parse(req.body);
    const issue = await service.updateIssue(req.params.issueId as string,
        req.user!.id,
        input
    );
    res.json({
        success: true,
        message: "Issue updated successfully",
        data: issue,
    });
});