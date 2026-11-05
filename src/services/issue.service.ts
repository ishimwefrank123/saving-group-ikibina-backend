import { Issue } from "../models/Issue.js";
import { Membership } from "../models/Membership.js";
import { ApiError } from "../utils/ApiError.js";

export async function createIssue(
    userId: string,
    input: {
        groupId: string;
        subject: string;
        description: string;
    }
){
    const membership = await Membership.findOne({
        user:userId,
        group: input.groupId,
        status: "active"
    });

    if(!membership){
        throw new ApiError(
            403,
            "You must be an active group member to report an issue"
        );
    }

    return Issue.create({
        reportedBy: userId,
        group: input.groupId,
        subject: input.subject,
        description: input.description
    });
}

