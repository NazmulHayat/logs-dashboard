"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createLog } from "@/lib/logs-api";
import { useToast } from "@/components/shared/Toast";
import { defaultNewLogValues, LogForm } from "./LogForm";

export function NewLogPageContent() {
  const router = useRouter();
  const toast = useToast();

  return (
    <div className="mx-auto max-w-[1060px]">
      <div className="mb-6">
        <Link href="/logs" className="btn btn-secondary px-3 py-1.5 text-[0.8125rem]" prefetch={false}>&larr; Back to logs</Link>
      </div>
      <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-[280px_1fr] md:gap-8">
        <div>
          <h1 className="mb-2 text-2xl font-bold tracking-tight">Create single log</h1>
          <p className="text-[0.9375rem] leading-[1.55] text-muted">Add a new log entry with a timestamp, severity level, source identifier, and a descriptive message.</p>
        </div>
        <div className="rounded-xl border border-border bg-surface px-8 py-7 shadow-card max-md:px-5 max-md:py-[22px]">
          <LogForm initial={defaultNewLogValues()} submitLabel="Create single log"
            onSubmit={async (payload) => { const created = await createLog(payload); toast.show("Log created successfully"); router.push(`/logs/${created.id}`); }}
            extraActions={<Link href="/logs" className="btn btn-secondary" prefetch={false}>Cancel</Link>} />
        </div>
      </div>
    </div>
  );
}
