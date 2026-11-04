
import { Group } from "../models/Group";
import { Membership } from "../models/Membership";
import { ApiError } from "../utils/ApiError";
import { generateInviteCode } from "../utils/generateInviteCode";

type CreateGroupInput = {
  name: string;
  description?: string;
  contributionAmount: number;
  contributionFrequency: "weekly" | "monthly";
  loanInterestRate: number;
  maxLoanAmount: number;
};

export async function createGroup(
  userId: string,
  input: CreateGroupInput
) {
  let inviteCode = generateInviteCode();

  for (
    let attempt = 0;
    await Group.exists({ inviteCode });
    attempt++
  ) {
    if (attempt > 5) {
      throw new Error("Could not generate a unique invite code");
    }

    inviteCode = generateInviteCode();
  }

  const group = await Group.create({
    ...input,
    inviteCode,
    createdBy: userId
  });

  try {
    await Membership.create({
      user: userId,
      group: group._id,
      role: "group-admin"
    });
  } catch (error) {
    await Group.findByIdAndDelete(group._id);
    throw error;
  }

  return group;
}

export async function joinGroup(
  userId: string,
  rawCode: string
) {
  const group = await Group.findOne({
    inviteCode: rawCode.trim().toUpperCase()
  });

  if (!group) {
    throw new ApiError(404, "Invalid invite code");
  }

  if (group.status !== "active") {
    throw new ApiError(403, "This group is frozen");
  }

  const existing = await Membership.findOne({
    user: userId,
    group: group._id
  });

  if (existing?.status === "active") {
    throw new ApiError(
      409,
      "You are already a member of this group"
    );
  }

  if (existing) {
    existing.status = "active";
    existing.role = "member";
    existing.joinedAt = new Date();
    await existing.save();

    return { group, membership: existing };
  }

  const membership = await Membership.create({
    user: userId,
    group: group._id,
    role: "member"
  });

  return { group, membership };
}

export async function getMyGroups(userId: string) {
  const memberships = await Membership.find({
    user: userId,
    status: "active"
  }).populate("group");

  return memberships.map((membership) => ({
    role: membership.role,
    group: membership.group
  }));
}

export async function getGroupForMember(
  userId: string,
  groupId: string
) {
  const membership = await Membership.findOne({
    user: userId,
    group: groupId,
    status: "active"
  });

  if (!membership) {
    throw new ApiError(
      403,
      "You are not an active member of this group"
    );
  }

  const group = await Group.findById(groupId);

  if (!group) {
    throw new ApiError(404, "Group not found");
  }

  return { group, membership };
}

export async function updateGroupRules(
  userId: string,
  groupId: string,
  input: Partial<CreateGroupInput>
) {
  const membership = await Membership.findOne({
    user: userId,
    group: groupId,
    status: "active"
  });

  if (!membership || membership.role !== "group-admin") {
    throw new ApiError(403, "Group admin access required");
  }

  const group = await Group.findByIdAndUpdate(
    groupId,
    { $set: input },
    { new: true, runValidators: true }
  );

  if (!group) {
    throw new ApiError(404, "Group not found");
  }

  return group;
}

export async function getGroupMembers(
  userId: string,
  groupId: string
) {
  await getGroupForMember(userId, groupId);

  return Membership.find({
    group: groupId,
    status: "active"
  })
    .populate("user", "name email")
    .select("user role joinedAt");
}

export async function changeMemberRole(
  actorId: string,
  groupId: string,
  targetUserId: string,
  role: "member" | "group-admin"
) {
  const actor = await Membership.findOne({
    user: actorId,
    group: groupId,
    status: "active"
  });

  if (!actor || actor.role !== "group-admin") {
    throw new ApiError(403, "Group admin access required");
  }

  if (actorId === targetUserId && role !== actor.role) {
    throw new ApiError(400, "You cannot change your own role");
  }

  const target = await Membership.findOne({
    user: targetUserId,
    group: groupId,
    status: "active"
  });

  if (!target) {
    throw new ApiError(404, "Active group member not found");
  }

  if (target.role === "group-admin" && role === "member") {
    const admins = await Membership.countDocuments({
      group: groupId,
      status: "active",
      role: "group-admin"
    });

    if (admins <= 1) {
      throw new ApiError(
        400,
        "A group must have at least one admin"
      );
    }
  }

  target.role = role;
  await target.save();

  return target;
}

export async function removeMember(
  actorId: string,
  groupId: string,
  targetUserId: string
) {
  const actor = await Membership.findOne({
    user: actorId,
    group: groupId,
    status: "active"
  });

  if (!actor || actor.role !== "group-admin") {
    throw new ApiError(403, "Group admin access required");
  }

  if (actorId === targetUserId) {
    throw new ApiError(400, "You cannot remove yourself");
  }

  const target = await Membership.findOne({
    user: targetUserId,
    group: groupId,
    status: "active"
  });

  if (!target) {
    throw new ApiError(404, "Active group member not found");
  }

  if (target.role === "group-admin") {
    const admins = await Membership.countDocuments({
      group: groupId,
      status: "active",
      role: "group-admin"
    });

    if (admins <= 1) {
      throw new ApiError(
        400,
        "You cannot remove the only group admin"
      );
    }
  }

  target.status = "removed";
  await target.save();

  return target;
}
