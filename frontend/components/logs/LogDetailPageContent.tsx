"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { formatDateTimeShort } from "@/lib/format";
import { deleteLog, fetchLog, updateLog } from "@/lib/logs-api";
import type { LogRecord } from "@/lib/types";
import { useToast } from "@/components/shared/Toast";
import { LogForm, logToFormValues } from "./LogForm";

type Props = { id: string };

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[1060px]">
      <div className="mb-6">
        <Link href="/logs" className="btn btn-secondary px-3 py-1.5 text-[0.8125rem]" prefetch={false}>&larr; Back to logs</Link>
      </div>
      {children}
    </div>
  );
}

export function LogDetailPageContent({ id }: Props) {
  const router = useRouter();
  const toast = useToast();
  const numericId = Number(id);
  const invalidId = !Number.isInteger(numericId) || numericId < 1;
  const [log, setLog] = useState<LogRecord | null>(null);
  const [loading, setLoading] = useState(!invalidId);
  const [loadError, setLoadError] = useState<string | null>(invalidId ? "Invalid log id." : null);

  const load = useCallback(async () => {
    if (invalidId) return;
    setLoading(true); setLoadError(null);
    try { setLog(await fetchLog(numericId)); }
    catch (e) {
      setLog(null);
      const msg = e instanceof Error ? e.message : "Failed to load log.";
      setLoadError(msg.includes("404") || msg.toLowerCase().includes("not found") ? "Log not found." : msg);
    } finally { setLoading(false); }
  }, [invalidId, numericId]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (loadError) toast.show(loadError); }, [loadError, toast]);

  const onDelete = async () => {
    if (invalidId || !log) return;
    if (!window.confirm("Delete this log permanently?")) return;
    try { await deleteLog(log.id); toast.show("Log deleted"); router.push("/logs"); router.refresh(); }
    catch (e) { toast.show(e instanceof Error ? e.message : "Delete failed"); }
  };

  if (loading || !log) {
    return (
      <PageShell>
        <div className="px-6 py-12 text-center">
          {loading ? <div className="skeleton h-[180px] mt-3" /> : <p className="text-sm text-sev-error-text">{loadError ?? "Unknown error."}</p>}
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-[280px_1fr] md:gap-8">
        <div>
          <h1 className="mb-2 text-2xl font-bold tracking-tight">Log #{log.id}</h1>
          <p className="text-[0.9375rem] leading-[1.55] text-muted">Edit the fields below or delete this entry.</p>
          <dl className="mt-6 flex flex-col gap-2.5">
            <div>
              <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-muted">Created</dt>
              <dd className="mt-0.5 font-mono text-[0.8125rem] text-primary">{formatDateTimeShort(log.created_at)}</dd>
            </div>
            <div>
              <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-muted">Updated</dt>
              <dd className="mt-0.5 font-mono text-[0.8125rem] text-primary">{formatDateTimeShort(log.updated_at)}</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-xl border border-border bg-surface px-8 py-7 shadow-card max-md:px-5 max-md:py-[22px]">
          <LogForm key={log.updated_at} initial={logToFormValues(log)} submitLabel="Save changes" idleLabel="No changes"
            onSubmit={async (payload) => {
              try { const updated = await updateLog(log.id, payload); setLog(updated); toast.show("Log updated"); }
              catch (e) { toast.show(e instanceof Error ? e.message : "Update failed"); throw e; }
            }}
            extraActions={<button type="button" className="btn btn-danger" onClick={() => void onDelete()}>Delete</button>} />
        </div>
      </div>
    </PageShell>
  );
}
