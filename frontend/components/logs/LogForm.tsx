"use client";

import type { FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";

import { datetimeLocalToIso, isoToDatetimeLocalValue } from "@/lib/format";
import type { Severity } from "@/lib/types";
import { SEVERITIES, SEVERITY_CLASSES } from "@/lib/types";

import { useToast } from "@/components/shared/Toast";

export type LogFormValues = {
  timestampLocal: string;
  severity: Severity;
  source: string;
  message: string;
};

type Props = {
  initial: LogFormValues;
  submitLabel: string;
  idleLabel?: string;
  onSubmit: (payload: { timestamp: string; severity: Severity; source: string; message: string }) => Promise<void>;
  extraActions?: ReactNode;
};

const SOURCE_MAX = 255;
const MESSAGE_MAX = 5000;

function validate(values: LogFormValues): string | null {
  if (!values.timestampLocal.trim()) return "Timestamp is required.";
  const source = values.source.trim();
  const message = values.message.trim();
  if (!source) return "Source is required.";
  if (source.length > SOURCE_MAX) return `Source must be ${SOURCE_MAX} characters or fewer.`;
  if (!message) return "Message is required.";
  if (message.length > MESSAGE_MAX) return `Message must be ${MESSAGE_MAX} characters or fewer.`;
  const t = new Date(values.timestampLocal);
  if (Number.isNaN(t.getTime())) return "Timestamp is not a valid date/time.";
  return null;
}

function isModified(current: LogFormValues, saved: LogFormValues): boolean {
  return current.timestampLocal !== saved.timestampLocal || current.severity !== saved.severity || current.source !== saved.source || current.message !== saved.message;
}

export function LogForm({ initial, submitLabel, idleLabel, onSubmit, extraActions }: Props) {
  const toast = useToast();
  const [values, setValues] = useState<LogFormValues>(initial);
  const [savedValues, setSavedValues] = useState<LogFormValues>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isModifiedState = useMemo(() => isModified(values, savedValues), [values, savedValues]);
  const patch = (partial: Partial<LogFormValues>) => setValues((v) => ({ ...v, ...partial }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const v = validate(values);
    if (v) { setError(v); toast.show(v); return; }
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({ timestamp: datetimeLocalToIso(values.timestampLocal), severity: values.severity, source: values.source.trim(), message: values.message.trim() });
      setSavedValues({ ...values, source: values.source.trim(), message: values.message.trim() });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Request failed.";
      setError(msg);
      toast.show(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const buttonText = submitting ? "Saving\u2026" : isModifiedState ? submitLabel : (idleLabel ?? submitLabel);

  return (
    <form className="flex flex-col gap-[22px]" onSubmit={handleSubmit} noValidate>
      <div className="grid grid-cols-1 gap-5 min-[541px]:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8125rem] font-semibold tracking-[0.02em] text-muted" htmlFor="log-timestamp">Timestamp</label>
          <input id="log-timestamp" className="input w-full" type="datetime-local" required value={values.timestampLocal} onChange={(e) => patch({ timestampLocal: e.target.value })} disabled={submitting} />
        </div>
        <fieldset className="m-0 flex flex-col gap-1.5 border-0 p-0" disabled={submitting}>
          <legend className="text-[0.8125rem] font-semibold tracking-[0.02em] text-muted">Severity</legend>
          <div className="flex flex-wrap gap-1.5 rounded-lg border border-border bg-[#f5f6f8] px-2 py-1.5">
            {SEVERITIES.map((s) => (
              <button key={s} type="button" className={`severity-pill ${SEVERITY_CLASSES[s]}${values.severity === s ? " severity-pill-active" : ""}`} onClick={() => patch({ severity: s })} aria-pressed={values.severity === s}>{s}</button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[0.8125rem] font-semibold tracking-[0.02em] text-muted" htmlFor="log-source">Source</label>
        <input id="log-source" className="input w-full" required maxLength={SOURCE_MAX} placeholder="e.g. auth-service, payment-api, cron-worker" value={values.source} onChange={(e) => patch({ source: e.target.value })} disabled={submitting} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[0.8125rem] font-semibold tracking-[0.02em] text-muted" htmlFor="log-message">Message</label>
        <textarea id="log-message" className="textarea min-h-[140px]" required maxLength={MESSAGE_MAX} placeholder="Describe what happened..." value={values.message} onChange={(e) => patch({ message: e.target.value })} disabled={submitting} rows={6} />
      </div>

      {error && <p className="mt-2 text-sm text-sev-error-text">{error}</p>}

      <div className="mt-1 flex flex-wrap gap-2.5 border-t border-border pt-1">
        <button type="submit" className={`btn ${isModifiedState ? "btn-primary" : "btn-secondary"}`} disabled={submitting || (!isModifiedState && !!idleLabel)}>{buttonText}</button>
        {extraActions}
      </div>
    </form>
  );
}

export function defaultNewLogValues(): LogFormValues {
  return { timestampLocal: isoToDatetimeLocalValue(new Date().toISOString()), severity: "INFO", source: "", message: "" };
}

export function logToFormValues(log: { timestamp: string; severity: Severity; source: string; message: string }): LogFormValues {
  return { timestampLocal: isoToDatetimeLocalValue(log.timestamp), severity: log.severity, source: log.source, message: log.message };
}
