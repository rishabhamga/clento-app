import { NextResponse, NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: any) {
  const store = (globalThis as any).__PERSONALIZATION_JOBS__ || {};
  const job = store[params.jobId];
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  const progress = job.rowCount ? Math.round((job.processed / job.rowCount) * 100) : 0;
  return NextResponse.json({ status: job.status, progress });
} 