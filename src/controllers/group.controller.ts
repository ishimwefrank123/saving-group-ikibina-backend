import type { Request, Response } from "express";
import z from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import * as groupService from "../services/group.service"


const createSchema = z.object({
    name: z.string().trim().min(2).max(100),
    description: z.string().trim().max(500).optional(),
    contributionAmount: z.number().finite().min(0),
    contributionFrequency: z.enum(["weekly", "monthly"]),
    loanInterestRat: z.number().finite().min(0).max(100),
    maxLoanAmount: z.number().finite().min(0)
});

const rulesSchema = createSchema.partial();

export const create = asyncHandler(
    async (req: Request, res: Response) => {
        const input = createSchema.parse(req.body);
        const group = await groupService.createGroup(
            req.user!.id,
            input
        );

        res.status(201).json({
            success: true,
            data: group
        })
    }
);

export const join = asyncHandler(
    async (req: Request, res: Response) => {
        const input = z.object({
            inviteCode: z.string().trim().min(4).max(20)
        }).parse(req.body);

        const result = await groupService.joinGroup(
            req.user!.id,
            input.inviteCode
        );

        res.status(200).json({
            success: true,
            data: result
        })
    }
)

export const myGroups = asyncHandler(
    async (req: Request, res: Response) => {
        const groups = await groupService.getMyGroups(
            req.user!.id
        );

        res.json({success: true, data: groups});
    }
);

export const getOne = asyncHandler(
    async (req: Request, res: Response) => {
        const result = await groupService.getGroupForMember(
            req.user!.id,
            req.params.groupId
        )
        
        res.json({success: true, data: result});
    }
);

export const updateRules = asyncHandler(
    async(req: Request, res: Response) => {
        const input = rulesSchema.parse(req.body);

        const group = await groupService.updateGroupRules(
            req.user!.id,
            req.params.groupId,
            input
        );
        res.json({success:true, data: group});
    }
)

export const members = asyncHandler(
    async(req: Request, res: Response) => {
        const members = await groupService.getGroupMembers(
            req.user!.id,
            req.params.groupId
        );
        res.json({success: true, data: members})
    }
)

export const changeRole = asyncHandler(
    async (req: Request, res: Response) => {
        const input = z.object({
            role: z.enum(["member","group-admin"])
        }).parse(req.body);

        const result = await groupService.changeMemberRole(
            req.user!.id,
            req.params.groupId,
            req.params.userId,
            input.role
        );

        res.json({success: true, data: result});
    }
);

export const remove = asyncHandler(
    async (req: Request, res: Response) => {
        const result = await groupService.removeMember(
            req.user!.id,
            req.params.groupId,
            req.params.userId
        );

        res.json({success: true, data: result})
    }
)