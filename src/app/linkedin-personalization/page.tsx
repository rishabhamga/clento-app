"use client";

import React, { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

// Simple tailwind-based dropzone & form for uploading a CSV (≤ 5k rows)
// and collecting product-context fields required for message generation.
export default function LinkedInPersonalizationPage() {
  const router = useRouter();

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // All product/context fields we need to capture; iterate to render inputs
  const fieldDefs = [
    { id: "coreOffering", label: "Core Offering" },
    { id: "competitiveAdvantages", label: "Competitive Advantages" },
    { id: "techStack", label: "Technology Stack" },
    { id: "caseStudies", label: "Case Studies" },
    { id: "leadMagnets", label: "Lead Magnets" },
    { id: "socialProof", label: "Social Proof" },
    { id: "valueProp", label: "Value Proposition" },
    { id: "painPoints", label: "Customer Pain Points" },
    { id: "successStories", label: "Success Stories & Proof" },
    { id: "campaignLanguage", label: "Campaign Language" },
    { id: "signOffs", label: "Message Sign-Offs (English)" },
    { id: "tone", label: "Tone of Voice" },
    { id: "ctas", label: "Calls To Action" },
  ] as const;

  type FieldKeys = (typeof fieldDefs)[number]["id"];
  const [fields, setFields] = useState<Record<FieldKeys, string>>(
    () =>
      fieldDefs.reduce((acc, f) => {
        // initialise dynamic keys
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        acc[f.id] = "";
        return acc;
      }, {} as Record<FieldKeys, string>)
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && !file.name.endsWith(".csv")) {
      setError("Please upload a valid .csv file only.");
      return;
    }
    setError(null);
    setCsvFile(file ?? null);
  };

  const handleFieldChange = (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
    key: FieldKeys
  ) => {
    setFields({ ...fields, [key]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!csvFile) {
      setError("CSV file is required.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", csvFile);
    formData.append("context", JSON.stringify(fields));

    try {
      const res = await fetch("/api/linkedin-personalization", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      // API returns a jobId we can use to track processing progress.
      const { jobId } = await res.json();
      router.push(`/linkedin-personalization/${jobId}`);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-semibold mb-6">LinkedIn Personalization</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* CSV Upload */}
        <div>
          <label className="block font-medium mb-2" htmlFor="csvFile">
            Upload Leads CSV (max 5,000 rows)
          </label>
          <input
            id="csvFile"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-800 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {csvFile && (
            <p className="mt-1 text-sm text-gray-600">Selected: {csvFile.name}</p>
          )}
        </div>

        {/* Dynamic Context Inputs */}
        {fieldDefs.map((f) => (
          <div key={f.id}>
            <label htmlFor={f.id} className="block font-medium mb-1">
              {f.label}
            </label>
            <textarea
              id={f.id}
              required
              rows={2}
              value={fields[f.id]}
              onChange={(e) => handleFieldChange(e, f.id)}
              className="w-full rounded border-gray-300 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>
        ))}

        {/* Submit */}
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Generate Messages"}
        </button>
      </form>
    </div>
  );
} 