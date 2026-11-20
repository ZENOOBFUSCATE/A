import { start } from "workflow/api";
import { NextResponse } from "next/server";
import { authorized } from "@/lib/auth";
import { createRecap } from "@/workflows/recap";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Access code မမှန်ပါ။" }, { status: 401 });
  try {
    const data = await request.json();
    if (typeof data.videoPath !== "string" || !data.videoPath.startsWith("recap/")) return NextResponse.json({ error: "Video upload ကို ပြန်လုပ်ပါ။" }, { status: 400 });
    const clone = data.clone === true;
    if (clone && (data.consent !== true || typeof data.samplePath !== "string" || !data.samplePath.startsWith("recap/"))) return NextResponse.json({ error: "Clone အတွက် အသံပိုင်ရှင်ခွင့်ပြုချက်နှင့် sample လိုအပ်ပါသည်။" }, { status: 400 });
    const minutes = Math.max(1, Math.min(10, Number(data.minutes) || 3));
    const voiceId = typeof data.voiceId === "string" ? data.voiceId.slice(0, 120) : "";
    if (!clone && !voiceId && !process.env.ELEVENLABS_VOICE_ID) return NextResponse.json({ error: "Voice ID ကို ထည့်ပါ သို့မဟုတ် Vercel Environment Variables ထဲတွင် သတ်မှတ်ပါ။" }, { status: 400 });
    const run = await start(createRecap, [{ videoPath: data.videoPath, samplePath: clone ? data.samplePath : "", minutes, voiceId, clone }]);
    return NextResponse.json({ runId: run.runId });
  } catch (error) {
    console.error("recap start error", error);
    return NextResponse.json({ error: "Recap job စတင်မရပါ။ Vercel Workflow ကိုစစ်ဆေးပါ။" }, { status: 500 });
  }
}
