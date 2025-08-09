import { NextResponse } from "next/server";
import { emailGenerationService } from "@/lib/email-generation-service";

export const dynamic = "force-dynamic";

/**
 * GET /api/email-personalization/sample-csv
 * Download sample CSV format for email personalization
 */
export async function GET() {
  try {
    const sampleCSV = emailGenerationService.generateSampleCSV();
    
    return new Response(sampleCSV, {
      headers: {
        "Content-Type": "text/csv;charset=utf-8",
        "Content-Disposition": "attachment; filename=email-personalization-sample.csv",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Sample CSV generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate sample CSV" },
      { status: 500 }
    );
  }
}