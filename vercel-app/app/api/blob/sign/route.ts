import { issueSignedToken, presignUrl } from "@vercel/blob";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { authorized } from "@/lib/auth";

export const runtime = "nodejs";
const VIDEO_MAX = 4 * 1024 * 1024 * 1024;
const SAMPLE_MAX = 40 * 1024 * 1024;

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Access code မမှန်ပါ။" }, { status: 401 });
  try {
    const { kind, filename, contentType, size } = await request.json();
    if (!(["video", "sample"].includes(kind)) || typeof filename !== "string" || typeof size !== "number") {
      return NextResponse.json({ error: "Upload အချက်အလက် မမှန်ပါ။" }, { status: 400 });
    }
    const mime = typeof contentType === "string" ? contentType : "";
    const allowed = kind === "video" ? mime.startsWith("video/") || mime.startsWith("audio/") : mime.startsWith("audio/");
    const limit = kind === "video" ? VIDEO_MAX : SAMPLE_MAX;
    if (!allowed || size < 1 || size > limit) return NextResponse.json({ error: kind === "video" ? "Audio/Video ဖိုင်သည် 4 GB အောက်ဖြစ်ရပါမည်။" : "Audio sample သည် 40 MB အောက်ဖြစ်ရပါမည်။" }, { status: 400 });
    const ext = filename.match(/\.[a-zA-Z0-9]{1,8}$/)?.[0]?.toLowerCase() || (kind === "video" ? ".mp4" : ".mp3");
    const pathname = `recap/${randomUUID()}/${kind}${ext}`;
    const expiry = Date.now() + 30 * 60 * 1000;
    const token = await issueSignedToken({ pathname, operations: ["put"], validUntil: expiry, allowedContentTypes: [mime], maximumSizeInBytes: limit });
    const { presignedUrl } = await presignUrl(token, { pathname, operation: "put", validUntil: expiry });
    return NextResponse.json({ pathname, url: presignedUrl });
  } catch (error) {
    console.error("blob signing error", error);
    return NextResponse.json({ error: "Private Vercel Blob upload URL မဖန်တီးနိုင်ပါ။ Blob Store ချိတ်ဆက်မှုကို စစ်ဆေးပါ။" }, { status: 500 });
  }
}
