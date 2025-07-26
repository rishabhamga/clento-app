import { NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { v4 as uuidv4 } from "uuid";
import Papa from "papaparse";
import type { LeadRow } from "@/types/personalization";
import { enrichCompany } from "@/lib/company-enrichment";
import { generateMessagesAI } from "@/lib/openai-message";
import pLimit from "p-limit";

/**
 * Expected multipart/form-data fields:
 *   - file: CSV file upload
 *   - context: JSON string containing product context fields
 *
 * Response: { jobId: string, rowCount: number }
 */
export async function POST(request: Request) {
  try {
    // Parse the incoming multipart form
    const formData = await request.formData();
    const file = formData.get("file");
    const contextRaw = formData.get("context");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "CSV file is required under 'file' field" },
        { status: 400 }
      );
    }

    // Read file content as text (UTF-8). 5k rows usually < 5-6 MB ⇒ safe.
    const csvText = await file.text();

    // Parse CSV synchronously.
    const records: Record<string, string>[] = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      bom: true,
      trim: true,
    });

    if (records.length === 0) {
      return NextResponse.json(
        { error: "Uploaded CSV appears to be empty." },
        { status: 400 }
      );
    }

    if (records.length > 5000) {
      return NextResponse.json(
        { error: "CSV exceeds maximum 5,000 rows." },
        { status: 400 }
      );
    }

    // Expected headers (case‐insensitive)
    const REQUIRED_HEADERS = [
      "First name",
      "Last name",
      "Title",
      "Company",
      "Location",
      "Linkedin url",
      "Company website",
    ];

    const headerCheck = REQUIRED_HEADERS.every((h) =>
      Object.keys(records[0]).some((k) => k.toLowerCase() === h.toLowerCase())
    );
    if (!headerCheck) {
      return NextResponse.json(
        { error: `CSV missing one or more required columns: ${REQUIRED_HEADERS.join(", ")}` },
        { status: 400 }
      );
    }

    // For now, stash data + context in memory (TODO: push to queue/DB)
    const jobId = uuidv4();
    const context = contextRaw ? JSON.parse(String(contextRaw)) : {};

    const leads = records as LeadRow[];

    // Immediately process (synchronous demo) – generate messages and CSV
    const limit = pLimit(5);
    const processedRows: any[] = [];

    // init job progress in store
    globalThis.__PERSONALIZATION_JOBS__ = globalThis.__PERSONALIZATION_JOBS__ || {};
    (globalThis.__PERSONALIZATION_JOBS__ as any)[jobId] = {
      rowCount: leads.length,
      processed: 0,
      status: "processing",
    };

    await Promise.all(
      leads.map((lead) =>
        limit(async () => {
          const enrichment = lead["Company website"]
            ? await enrichCompany(lead["Company website"])
            : undefined;
          const msgs = await generateMessagesAI(lead, context, enrichment);
          processedRows.push({
            ...lead,
            connection_request: msgs.connection_request,
            linkedin_message: msgs.linkedin_message,
            follow_up_message: msgs.follow_up_message,
          });

          // update progress
          (globalThis.__PERSONALIZATION_JOBS__ as any)[jobId].processed += 1;
        })
      )
    );

    const csvOut = Papa.unparse(processedRows);

    globalThis.__PERSONALIZATION_JOBS__ = globalThis.__PERSONALIZATION_JOBS__ || {};
    (globalThis.__PERSONALIZATION_JOBS__ as any)[jobId] = {
      csv: csvOut,
      rowCount: leads.length,
      processed: leads.length,
      status: "completed",
      completedAt: Date.now(),
    };

    return NextResponse.json({ jobId, rowCount: leads.length });
  } catch (err: any) {
    console.error("/api/linkedin-personalization error", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
} 