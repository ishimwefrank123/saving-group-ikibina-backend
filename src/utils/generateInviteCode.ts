
import { randomBytes } from "crypto";

export function generateInviteCode(): string {
  return randomBytes(5).toString("hex").toUpperCase();
}
