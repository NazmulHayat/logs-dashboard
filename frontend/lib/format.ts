export function formatDateTimeShort(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function isoToDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function datetimeLocalToIso(value: string): string {
  const d = new Date(value);
  return d.toISOString();
}

export function dayRangeToApiParams(startDate: string, endDate: string) {
  return {
    startDate: startDate ? `${startDate}T00:00:00` : undefined,
    endDate: endDate ? `${endDate}T23:59:59.999` : undefined,
  };
}
