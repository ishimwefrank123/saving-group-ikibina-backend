import { Group } from "../models/Group.js";
import { Issue } from "../models/Issue.js";
import { Membership } from "../models/Membership.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";

export interface ListUserQuery{
  search?: string;
  status?: "active" | "blocked";
  platformRole?: "user" | "platform-admin";
}

export interface ListGroupsQuery{
  search?: string;
  status?: "active" | "frozen";
}

export interface ListIssuesQuery{
  status? : "open" | "in-review" | "resolved" | "dismissed";
  groupId?: string;
}

/*
Platform dashboad Statistics
Returns simple platform numbers: groups, members, users, total money in pools, and open isssues
 */

export async function dashboard() {
  const [
    totalUsers,
    activeUsers,
    blockedUsers,
    totalGroups,
    activeGroups,
    frozenGroups,
    totalMembers,
    openIssues,
    resolvedIssues,
    poolSum,
    recentUsers,
    recentGroups,
    recentIssues,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({status: "active"}),
    User.countDocuments({status: "blocked"}),
    Group.countDocuments(),
    Group.countDocuments({status: "active"}),
    Group.countDocuments({status: "frozen"}),
    Membership.countDocuments({status: "active"}),
    Issue.countDocuments({status: {$in: ["open","in-review"]}}),
    Issue.countDocuments({status: "resolved"}),
    Group.aggregate<{_id: null; total: number}>([
      {$group: {_id: null, total: {$sum: "$poolBalance"}}},
    ]),
    User.find().select("-password").sort({createdAt: -1}).limit(5),
    Group.find().populate("createdBy","name email").sort({createdAt: -1}).limit(5),
    Issue.find({status: { $in: ["open", "in-review"]}})
    .populate("reportedBy", "name email")
    .populate("group", "name invitedCode")
    .sort({createdAt: -1})
    .limit(5)
  ]);


  const totalMoneyInPools = poolSum[0]?.total ?? 0;

  return {
    overview: {
      users: {
        total: totalUsers,
        active: activeUsers,
        blocked: blockedUsers,
      },
      groups: {
        total: totalGroups,
        active: activeGroups,
        frozen: frozenGroups,
      },
      members: {
        totalActiveMemberships: totalMembers,
      },
      finance: {
        totalMoneyInPools,
      },
      issues:{
        openOrInReview: openIssues,
        resolved: resolvedIssues,
      },
    },
    recentActivity: {
      users: recentUsers,
      groups: recentGroups,
      issues: recentIssues,
    }
  };
}

  // List all users with search and filtering

  export async function listUsers(query: ListUsersQuery = {}){
    const filter: Record<string, unkown> = {};

    if(query.search){
      const searchRegex = new RegExp(query.search.trim(),"i");
      filter.$or = [{name: searchRegex}, {email: searchRegex }]
    }

    if(query.status){
      filter.status = query.status;
    }

    if(query.plaformRole){
      filter.platformRole = query.platformRole;
    }

    return User.find(filter).select("-password").sort({createdAt: -1}).limit(200);
  }

  // Get detailed profile for a specific user, including group memberships and reported issues

  export async function getUserDetails(userId: string){
    const user = await User.findById(userId).select("-password");

    if(!user){
      throw new ApiError(404, "User not found");
    }

    const [memberships, issues] = await Promise.all([
      Membership.find({user: userId})
      .populate("group", "name inviteCode status contributionAmount contributionFrequency")
      .sort({joinedAt: -1}),
      User.find({reportedBy: userId})
      .populate("group", "name inviteCode")
      .sort({createdAt: -1}),
    ]);
    return {user, memberships, issues};
  }

  // Activate or block a user account with a mandatory reason
  export async function setUserStatus(
    actorId: string,
    userId: string,
    staus: "active" | "blocked",
    reason?: string
  ){
    if(actorId === userId && status === "blocked"){
      throw new ApiError(400, "You cannot block your own acount");
    }
    const user = await User.findByIdAndUpdate(
      userId,
      {
        status,
        blockReason: status === "blocked" ? reason: undefined,
      },
      {new: true, runValidators: true}
    ).select("-password");

    if(!user){
      throw new ApiError(404, "User not found");
    }

    return user;
  }

  // List all groups with search and member counts

  export async function listGroups(query: ListGroupsQuery = {}){
    const filter: Record<string, unkown> = {};

    if(query.search){
      const searchRegex = new RegExp(query.search.trim(), "i");
      filter.$or = [{name: searchRegex}, {inviteCode: searchRegex}];
    }

    if(query.status){
      filter.status = query.status;
    }

    const groups = await Group.find(filter)
    .populate("createdBy","name email")
    .sort({createdAt: -1})
    .limit(200);

    const groupIds = groups.map((g) => g._id);
    const memberCounts = await Membership.aggregate<{_id: unknown; count: number}>([
      {$match: { group: {$in: groupIds}, status: "active"}},
      {$group: {_id: "$group", count: {$sum: 1}}},
    ]);

    const countMap = new Map(memberCounts.map((mc) => [String(mc._id), mc.count]));

    return groups.map((group) => ({
      ...group.toObject(),
      memberCount: countMap.get(String(group._id))??0,
    }));

  }

  //  Get detailed group information with members and issues
  export async function getGroupDetails(groupId: string){
    const group = await Group.findById(groupId).populate("createdBy", "name email");

    if(!group){
      throw new ApiError(404, "Group not found");
    }

    const [members, issue] = await Promise.all([
      Membership.find({group: groupId, status: "active"})
      .populate("user", "name email status")
      .sort({role:1, joinedAt: -1}),
      Issue.find({group: groupId})
      .populate("reportedBy", "name email")
      .sort({createdAt: -1}),
    ]);
    
    return{
      group,
      memberCount: members.length,
      members,
      issue,
    };
  }

  // Freeze or unfreeze a group with a mandatory reason
  export async function setGroupStatus(
    groupId: string,
    status: "active" | "frozen",
    reason?: string
  ){
    const group = await Group.findByIdAndUpdate(
      groupId,
      {
        status,
        freezeReason: status === "frozen" ? reason: undefined,
      },
      {new: true, runValidators: true}
    ).populate("createdBy","name email");

    if(!group){
      throw new ApiError(404, "Group not found");
    }
    return group;
  }

  // List all member reports / issues

  export async function listIssues(query: ListIssuesQuery = {}){
    const filter: Record<string,unknown> = {};

    if(query.status){
      filter.status = query.status;
    }
    if(query.groupId){
      filter.group = query.groupId;
    }

    return Issue.find(filter)
    .populate("reportedBy","name email")
    .populate("group", "name inviteCode status")
    .populate("resolvedBy", " name email")
    .sort({ createdAt: -1})
    .limit(200);
  }

  // get single issue details

  export async function getIssueDetails(issueId: string){
    const issue = await Issue.findById(issueId)
    .populate("reportedBy","name email")
    .populate("group","name inviteCode status")
    .populate("resolvedBy","name email");

    if(!issue){
      throw new ApiError(404, "Issue not found");
    }

    return issue;
  }

  // Update issue status and admin note

  export async function updateIssue(
    issueId: string,
    actorId: string,
    input: {
      status: "open" | "in-review" | "resolved" | "dismissed";
      adminNote?: string;
    }
  ){
    const isResolvedOrDismissed = input.status === "resolved" || input.status === "dismissed";

    const issue = await Issue.findByIdAndUpdate(
      issueId,
      {
        status: input.status,
        adminNote: input.adminNote
        resolvedBy: isResolvedOrDismissed ? actorId: undefined,
      },
      {new: true, runValidators: true}
    )
    .populate("reportedBy", "name email")
    .populate("group", "name invideCode status")
    .populate("resolvedBy","name email");

    if(!issue){
      throw new ApiError(404, "Issue not found");
    }

    return issue;

  }