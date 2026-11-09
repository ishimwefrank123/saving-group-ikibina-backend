import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectDatabase } from "../config/database.js";
import { User } from "../models/User.js";
import { Group } from "../models/Group.js";
import { Membership } from "../models/Membership.js";
import { Issue } from "../models/Issue.js";

async function seed() {
  await connectDatabase();
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("Password123!", 10);

  // 1. Create Platform Admin
  let admin = await User.findOne({ email: "admin@ikimina.rw" });
  if (!admin) {
    admin = await User.create({
      name: "Platform Super Admin",
      email: "admin@ikimina.rw",
      password: passwordHash,
      platformRole: "platform-admin",
      status: "active",
    });
    console.log("Created Platform Admin: admin@ikimina.rw / Password123!");
  }

  // 2. Create 2 Group Admins
  const groupAdmin1 = await User.findOneAndUpdate(
    { email: "admin1@kigali.rw" },
    {
      name: "Claude Niyomugabo",
      email: "admin1@kigali.rw",
      password: passwordHash,
      platformRole: "user",
      status: "active",
    },
    { upsert: true, new: true }
  );

  const groupAdmin2 = await User.findOneAndUpdate(
    { email: "admin2@kigali.rw" },
    {
      name: "ISHIMWE Frank",
      email: "admin2@kigali.rw",
      password: passwordHash,
      platformRole: "user",
      status: "active",
    },
    { upsert: true, new: true }
  );

  // 3. Create 2 Regular Members
  const member1 = await User.findOneAndUpdate(
    { email: "member1@kigali.rw" },
    {
      name: "Leandre Byiringiro",
      email: "member1@kigali.rw",
      password: passwordHash,
      platformRole: "user",
      status: "active",
    },
    { upsert: true, new: true }
  );

  const member2 = await User.findOneAndUpdate(
    { email: "member2@kigali.rw" },
    {
      name: "Jean Remy Ikuzwe",
      email: "member2@kigali.rw",
      password: passwordHash,
      platformRole: "user",
      status: "active",
    },
    { upsert: true, new: true }
  );

  // 4. Create Sample Group with initial Pool Balance
  const group = await Group.findOneAndUpdate(
    { inviteCode: "KGL2026" },
    {
      name: "Kigali Tech Savings",
      description: "Sample group for team demo",
      inviteCode: "KGL2026",
      createdBy: groupAdmin1._id,
      contributionAmount: 20000,
      contributionFrequency: "monthly",
      loanInterestRate: 5,
      maxLoanAmount: 100000,
      poolBalance: 240000,
      status: "active",
    },
    { upsert: true, new: true }
  );

  // 5. Create Memberships
  await Membership.findOneAndUpdate(
    { user: groupAdmin1._id, group: group._id },
    { role: "group-admin", status: "active" },
    { upsert: true }
  );

  await Membership.findOneAndUpdate(
    { user: groupAdmin2._id, group: group._id },
    { role: "group-admin", status: "active" },
    { upsert: true }
  );

  await Membership.findOneAndUpdate(
    { user: member1._id, group: group._id },
    { role: "member", status: "active" },
    { upsert: true }
  );

  await Membership.findOneAndUpdate(
    { user: member2._id, group: group._id },
    { role: "member", status: "active" },
    { upsert: true }
  );

  // 6. Create a Sample Reported Issue
  await Issue.findOneAndUpdate(
    { subject: "Dispute on loan interest calculation" },
    {
      reportedBy: member1._id,
      group: group._id,
      subject: "Dispute on loan interest calculation",
      description: "My loan repayment calculated 10% instead of the group 5% rate.",
      status: "open",
    },
    { upsert: true }
  );

  console.log("Seeding finished successfully!");
  process.exit(0);
}

seed().catch(console.error);
