import crypto from "crypto";
export function hashStable(s: string): string {
  return crypto.createHash("sha1").update(s).digest("hex");
}
