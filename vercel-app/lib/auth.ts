import { timingSafeEqual } from "node:crypto";

export function authorized(request: Request): boolean {
  const expected = process.env.RECAP_ACCESS_CODE || "";
  const supplied = request.headers.get("x-recap-access-code") || "";
  if (!expected || !supplied) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}
