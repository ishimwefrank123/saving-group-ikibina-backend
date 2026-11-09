import { randomBytes } from "crypto";

export function generateTransactionReference(prefix = "TXN"): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomHex = randomBytes(4).toString("hex").toUpperCase();
  return `${prefix}-${dateStr}-${randomHex}`;
}
