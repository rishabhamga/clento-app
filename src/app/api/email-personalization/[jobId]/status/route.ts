import { NextRequest, NextResponse } from "next/server";
import type { EmailPersonalizationJob } from "@/types/email-personalization";

export const dynamic = "force-dynamic";

/**
 * GET /api/email-personalization/[jobId]/status
 * Get the status and progress of an email personalization job
 */
export async function GET(
  _req: NextRequest, 
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

    // Calculate progress percentage
    const progress = job.rowCount ? Math.round((job.processed / job.rowCount) * 100) : 0;

    // Estimate remaining time
    const timeElapsed = Date.now() - job.startedAt.getTime();
    const averageTimePerLead = job.processed > 0 ? timeElapsed / job.processed : 8000; // 8 seconds default
    const estimatedRemainingTime = Math.ceil((job.rowCount - job.processed) * averageTimePerLead / 1000);

    const response = {
      jobId: job.jobId,
      status: job.status,
      progress,
      processed: job.processed,
      total: job.rowCount,
      campaignId: job.campaignId,
      startedAt: job.startedAt,
      estimatedRemainingTime: job.status === 'processing' ? estimatedRemainingTime : 0,
      errors: job.errors?.length || 0,
      ...(job.status === 'completed' && job.results && {
        results: {
          successCount: job.results.successCount,
          errorCount: job.results.errorCount,
          scrapingStats: job.results.scrapingStats
        }
      }),
      ...(job.status === 'completed' && {
        completedAt: job.completedAt
      }),
      ...(job.errors && job.errors.length > 0 && {
        recentErrors: job.errors.slice(-3).map(error => ({
          leadName: error.leadName,
          error: error.error,
          row: error.row
        }))
      })
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json(
      { error: "Failed to get job status" },
      { status: 500 }
    );
  }
}