import { start } from "workflow/api";
import { NextResponse } from "next/server";
import { encryptGeminiKeys } from "@/lib/key-crypto";
import { createRecap } from "@/workflows/recap";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload: unknown = await request.json();
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return NextResponse.json({ error: "Request အချက်အလက် မမှန်ပါ။" }, { status: 400 });
    const data = payload as Record<string, unknown>;
    const videoPath = typeof data.videoPath === "string" ? data.videoPath : "";
    if (!videoPath.startsWith("recap/")) return NextResponse.json({ error: "Video upload ကို ပြန်လုပ်ပါ။" }, { status: 400 });
    const suppliedKeys: unknown[] = Array.isArray(data.geminiKeys) ? data.geminiKeys as unknown[] : [];
    const stringKeys = suppliedKeys.filter((key): key is string => typeof key === "string");
    const geminiKeys: string[] = [...new Set(stringKeys.map((key) => key.trim()).filter((key) => key.length > 0))];
    if (!geminiKeys.length || geminiKeys.length > 5 || geminiKeys.some((key: string) => key.length > 300)) {
      return NextResponse.json({ error: "Gemini API key ၁ ခုမှ ၅ ခုအထိ ထည့်ပါ။" }, { status: 400 });
    }
    if (!process.env.GEMINI_KEYS_ENCRYPTION_SECRET || process.env.GEMINI_KEYS_ENCRYPTION_SECRET.length < 32) {
      return NextResponse.json({ error: "Vercel Environment Variables ထဲ GEMINI_KEYS_ENCRYPTION_SECRET ကို အနည်းဆုံး 32 လုံးသတ်မှတ်ပါ။" }, { status: 503 });
    }
    const encryptedGeminiKeys = encryptGeminiKeys(geminiKeys);
    const clone = data.clone === true;
    const samplePath = typeof data.samplePath === "string" ? data.samplePath : "";
    if (clone && (data.consent !== true || !samplePath.startsWith("recap/"))) return NextResponse.json({ error: "Clone အတွက် အသံပိုင်ရှင်ခွင့်ပြုချက်နှင့် sample လိုအပ်ပါသည်။" }, { status: 400 });
    const minutes = Math.max(1, Math.min(10, Number(data.minutes) || 3));
    const voiceId = typeof data.voiceId === "string" ? data.voiceId.slice(0, 120) : "";
    if (!clone && !voiceId && !process.env.ELEVENLABS_VOICE_ID) return NextResponse.json({ error: "Voice ID ကို ထည့်ပါ သို့မဟုတ် Vercel Environment Variables ထဲတွင် သတ်မှတ်ပါ။" }, { status: 400 });
    const run = await start(createRecap, [{ videoPath, samplePath: clone ? samplePath : "", minutes, voiceId, clone, encryptedGeminiKeys }]);
    return NextResponse.json({ runId: run.runId });
  } catch (error) {
    console.error("recap start error", error);
    return NextResponse.json({ error: "Recap job စတင်မရပါ။ Vercel Workflow ကိုစစ်ဆေးပါ။" }, { status: 500 });
  }
}
