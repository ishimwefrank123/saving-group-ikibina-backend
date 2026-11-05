import { Group } from "../models/Group.js";
import { Issue } from "../models/Issue.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";

export async function dashboard() {
    const [
        users,
        activeUsers,
        groups,
        activeGroups,
        openIssues
    ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({status: "active"}),
        Group.countDocuments(),
        Group.countDocuments({status: "active"}),
        Issue.countDocuments({
            status: {$in: ["open","in-review"]}
        })
    ]);

    return {
        users,
        activeUsers,
        groups,
        activeGroups,
        openIssues
    };
}

export async function listUsers() {
    return User.find()
    .select("-password")
    .sort({createdAt: -1})
    .limit(200);
}

export async function listGroups() {
    return Group.find()
    .populate("createdBy", "name email")
    .sort({createdAt: -1})
    .limit(200);
}

export async function listIssues() {
    return Issue.find()
    .populate("reportedBy", "name email")
    .populate("group","name")
    .sort({createdAt: -1})
    .limit(200)
}

export async function setUserStatus(
    actorId: string,
    userId: string,
    status: "active" | "blocked"
) {
    if(actorId === userId && status === "blocked"){
        throw new ApiError(
            400,
            "You cannot block your own account"
        )
    }

    const user = await User.findByIdAndUpdate(
        userId,
        {status},
        {new: true, runValidators: true}
    ).select("-password");

    if(!user){
        throw new ApiError(404, "User not found");
    }

    return user;
}

export async function setGroupStatus(
    groupId: string,
    status: "active" | "frozen",
    reason?: string
){
    const group = await Group.findByIdAndUpdate(
        groupId,
        {
            status,
            freezeReason: status === "frozen" ? reason: undefined
        },
        {new: true, runValidators: true}
    );

    if(!group){
        throw new ApiError (404, "Group not found");
    }

    return group;
}

export async function updateIssue(
    issueId: string,
    actorId: string,
    input: {
        status: "open" | "in-review" | "resolved" | "dismissed";
        adminNote?: string;
    }
){
    const issue = await Issue.findByIdAndUpdate(
        issueId,
        {
            status: input.status,
            adminNote: input.adminNote,
            resolvedBy: actorId
        },
        {new: true, runValidators: true}
    );

    if(!issue){
        throw new ApiError(404, "Issue not found");
    }

    return issue;
}