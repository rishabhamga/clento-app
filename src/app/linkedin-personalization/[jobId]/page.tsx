"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function JobStatusPage() {
  const params = useParams();
  const jobId = params?.jobId as string;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let interval: any;
    async function checkStatus() {
      const res = await fetch(`/api/linkedin-personalization/${jobId}/status`);
      if (res.ok) {
        const json = await res.json();
        if (json.status === "completed") {
          setReady(true);
          clearInterval(interval);
        }
      }
    }
    checkStatus();
    interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, [jobId]);

  if (!jobId) return <p>Invalid job ID.</p>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold mb-4">Personalization Job</h1>
      {ready ? (
        <a
          href={`/api/linkedin-personalization/${jobId}/download`}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Download Personalized CSV
        </a>
      ) : (
        <p>Processing your CSV…</p>
      )}
    </div>
  );
} 