
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { ApiError } from "../utils/ApiError";

function createToken(userId: string): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    { userId },
    secret,
    {
      expiresIn: (process.env.JWT_EXPIRES_IN || "1d") as
        jwt.SignOptions["expiresIn"]
    }
  );
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}) {
  const email = input.email.toLowerCase().trim();

  if (await User.exists({ email })) {
    throw new ApiError(
      409,
      "An account with this email already exists"
    );
  }

  const password = await bcrypt.hash(input.password, 12);

  const user = await User.create({
    name: input.name,
    email,
    password
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      platformRole: user.platformRole
    },
    token: createToken(user.id)
  };
}

export async function loginUser(input: {
  email: string;
  password: string;
}) {
  const user = await User.findOne({
    email: input.email.toLowerCase().trim()
  }).select("+password");

  if (
    !user ||
    !(await bcrypt.compare(input.password, user.password))
  ) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (user.status !== "active") {
    throw new ApiError(403, "This account is blocked");
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      platformRole: user.platformRole
    },
    token: createToken(user.id)
  };
}
