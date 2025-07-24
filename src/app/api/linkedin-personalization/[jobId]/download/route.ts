import { NextResponse, NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: any) {
  const store = (globalThis as any).__PERSONALIZATION_JOBS__ || {};
  const job = store[params.jobId];
  if (!job || job.status !== "completed") {
    return NextResponse.json({ error: "Job not found or not completed" }, { status: 404 });
  }

  return new Response(job.csv, {
    headers: {
      "Content-Type": "text/csv;charset=utf-8",
      "Content-Disposition": `attachment; filename=personalized_${params.jobId}.csv`,
    },
  });
} 