import { NextRequest, NextResponse } from "next/server";
import type { EmailPersonalizationJob } from "@/types/email-personalization";

export const dynamic = "force-dynamic";

/**
 * GET /api/email-personalization/[jobId]/download
 * Download the completed email personalization results as CSV
 */
export async function GET(
  _request: NextRequest, 
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    
    const store = (globalThis as any).__EMAIL_PERSONALIZATION_JOBS__ || {};
    const job: EmailPersonalizationJob = store[jobId];
    
    if (!job) {
      return NextResponse.json(
        { error: "Job not found" }, 
        { status: 404 }
      );
    }

    if (job.status !== "completed") {
      return NextResponse.json(
        { 
          error: "Job not completed yet", 
          status: job.status,
          progress: job.rowCount ? Math.round((job.processed / job.rowCount) * 100) : 0
        }, 
        { status: 400 }
      );
    }

    if (!job.results?.csv) {
      return NextResponse.json(
        { error: "No results available for download" },
        { status: 404 }
      );
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `email-personalization-${job.campaignId}-${timestamp}-${jobId.slice(0, 8)}.csv`;

    return new Response(job.results.csv, {
      headers: {
        "Content-Type": "text/csv;charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Job-Id": jobId,
        "X-Campaign-Id": job.campaignId,
        "X-Success-Count": job.results.successCount.toString(),
        "X-Error-Count": job.results.errorCount.toString(),
      },
    });

  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Failed to download results" },
      { status: 500 }
    );
  }
}