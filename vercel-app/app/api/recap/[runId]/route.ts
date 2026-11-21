import { getRun } from "workflow/api";
import { NextResponse } from "next/server";
import { authorized } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ runId: string }> }) {
  if (!authorized(request)) return NextResponse.json({ error: "Access code မမှန်ပါ။" }, { status: 401 });
  const { runId } = await params;
  if (!/^wrun_[a-zA-Z0-9]+$/.test(runId)) return NextResponse.json({ error: "Run ID မမှန်ပါ။" }, { status: 400 });
  try {
    const run = getRun(runId);
    const status = await run.status;
    if (status === "completed") return NextResponse.json({ status, result: await run.returnValue });
    if (status === "failed" || status === "cancelled") return NextResponse.json({ status, error: `Workflow ${status}` });
    return NextResponse.json({ status });
  } catch (error) {
    console.error("recap status error", error);
    return NextResponse.json({ error: "Job status ကိုမဖတ်နိုင်ပါ။" }, { status: 404 });
  }
}
