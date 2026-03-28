const MAX_DATE_RANGE_DAYS = 1825;

type Ok<T> = { ok: true; value: T };
type Err = { ok: false; error: string };
export type ValidationResult<T> = Ok<T> | Err;

function parseDay(s: string): Date | null {
  if (!s) return null;
  const d = new Date(`${s}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function validateDateRange(
  startDate: string,
  endDate: string,
): ValidationResult<{ startDate: string; endDate: string }> {
  const start = parseDay(startDate);
  const end = parseDay(endDate);
  if ((startDate && !start) || (endDate && !end)) {
    return { ok: false, error: "Date filters must be valid dates." };
  }
  if (start && end && start > end) {
    return { ok: false, error: "Start date must not be after end date." };
  }
  if (start && end) {
    const diffDays = Math.floor(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays > MAX_DATE_RANGE_DAYS) {
      return {
        ok: false,
        error: "Date range must be 5 years or fewer.",
      };
    }
  }
  return { ok: true, value: { startDate, endDate } };
}

export type DashboardFilterInput = {
  startDate: string;
  endDate: string;
  source: string;
};

export function validateDashboardFilters(
  v: DashboardFilterInput,
): ValidationResult<DashboardFilterInput> {
  const next: DashboardFilterInput = { ...v, source: v.source.trim() };
  if (next.source.length > 255) {
    return { ok: false, error: "Source must be 255 characters or fewer." };
  }
  const dates = validateDateRange(next.startDate, next.endDate);
  if (!dates.ok) return dates;
  return { ok: true, value: next };
}

export type LogsFilterInput = DashboardFilterInput & { search: string };

export function validateLogsFilters(
  v: LogsFilterInput,
): ValidationResult<LogsFilterInput> {
  const next: LogsFilterInput = {
    ...v,
    search: v.search.trim(),
    source: v.source.trim(),
  };
  if (next.search.length > 200) {
    return { ok: false, error: "Search must be 200 characters or fewer." };
  }
  if (next.source.length > 255) {
    return { ok: false, error: "Source must be 255 characters or fewer." };
  }
  const dates = validateDateRange(next.startDate, next.endDate);
  if (!dates.ok) return dates;
  return { ok: true, value: next };
}
