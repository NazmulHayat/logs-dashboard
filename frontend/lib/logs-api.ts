import type {
  LogListResponse,
  LogRecord,
  Severity,
  SeverityDistributionResponse,
  SortableField,
  SummaryResponse,
  TopSourcesResponse,
  TrendResponse,
} from "./types";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type ListParams = {
  search?: string;
  severity?: Severity | "";
  source?: string;
  startDate?: string;
  endDate?: string;
  sortBy: SortableField;
  sortOrder: "asc" | "desc";
  page: number;
  pageSize: number;
};

type AnalyticsParams = {
  startDate?: string;
  endDate?: string;
  severity?: Severity | "";
  source?: string;
};

type TopSourcesParams = AnalyticsParams & {
  limit?: number;
};

function buildSearchParams(
  base: Record<string, string | number | undefined>,
): string {
  const p = new URLSearchParams();
  Object.entries(base).forEach(([k, v]) => {
    if (v !== undefined && v !== "") p.set(k, String(v));
  });
  const s = p.toString();
  return s ? `?${s}` : "";
}

function formatValidationError(item: unknown): string | null {
  if (!item || typeof item !== "object") return null;
  const maybeItem = item as { loc?: unknown; msg?: unknown };
  if (typeof maybeItem.msg !== "string") return null;

  const path = Array.isArray(maybeItem.loc)
    ? maybeItem.loc
        .filter((part): part is string | number => typeof part === "string" || typeof part === "number")
        .filter((part) => part !== "body" && part !== "query")
        .join(".")
    : "";

  return path ? `${path}: ${maybeItem.msg}` : maybeItem.msg;
}

function extractErrorMessage(detail: unknown, fallback: string): string {
  if (typeof detail === "string" && detail.trim()) return detail;

  if (Array.isArray(detail)) {
    const firstMessage = detail.map(formatValidationError).find(Boolean);
    if (firstMessage) return firstMessage;
  }

  return fallback;
}

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) {
    if (!res.ok) throw new Error(res.statusText || "Request failed");
    return undefined as T;
  }
  let data: T;
  try {
    data = JSON.parse(text) as T;
  } catch {
    if (!res.ok) throw new Error(text || res.statusText || "Request failed");
    throw new Error("Invalid server response");
  }
  if (!res.ok) {
    const detail =
      typeof data === "object" && data !== null && "detail" in data
        ? extractErrorMessage(
            (data as { detail: unknown }).detail,
            res.statusText || "Request failed",
          )
        : text;
    throw new Error(detail || res.statusText);
  }
  return data;
}

type LogPayload = {
  timestamp: string;
  severity: Severity;
  source: string;
  message: string;
};

type BulkLogPayload = {
  items: LogPayload[];
};

export async function fetchLogs(params: ListParams): Promise<LogListResponse> {
  const q = buildSearchParams({
    search: params.search,
    severity: params.severity || undefined,
    source: params.source,
    start_date: params.startDate,
    end_date: params.endDate,
    sort_by: params.sortBy,
    sort_order: params.sortOrder,
    page: params.page,
    page_size: params.pageSize,
  });
  const res = await fetch(`${apiBaseUrl}/api/logs${q}`, {
    cache: "no-store",
  });
  return parseJson<LogListResponse>(res);
}

export async function fetchLog(id: number): Promise<LogRecord> {
  const res = await fetch(`${apiBaseUrl}/api/logs/${id}`, { cache: "no-store" });
  return parseJson<LogRecord>(res);
}

async function jsonRequest<T>(method: string, url: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  return parseJson<T>(res);
}

export async function createLog(body: LogPayload): Promise<LogRecord> {
  return jsonRequest<LogRecord>("POST", `${apiBaseUrl}/api/logs`, body);
}

export async function updateLog(id: number, body: LogPayload): Promise<LogRecord> {
  return jsonRequest<LogRecord>("PUT", `${apiBaseUrl}/api/logs/${id}`, body);
}

export async function deleteLog(id: number): Promise<void> {
  const res = await fetch(`${apiBaseUrl}/api/logs/${id}`, { method: "DELETE" });
  await parseJson<void>(res);
}

export async function bulkCreateLogs(body: BulkLogPayload): Promise<{ inserted: number }> {
  return jsonRequest<{ inserted: number }>(
    "POST",
    `${apiBaseUrl}/api/logs/bulk`,
    body,
  );
}

async function fetchAnalytics<T>(
  path: string,
  params: AnalyticsParams,
): Promise<T> {
  const q = buildSearchParams({
    start_date: params.startDate,
    end_date: params.endDate,
    severity: params.severity || undefined,
    source: params.source,
  });
  const res = await fetch(`${apiBaseUrl}${path}${q}`, { cache: "no-store" });
  return parseJson<T>(res);
}

export function fetchSummary(params: AnalyticsParams) {
  return fetchAnalytics<SummaryResponse>(
    "/api/logs/analytics/summary",
    params,
  );
}

export function fetchTrend(params: AnalyticsParams) {
  return fetchAnalytics<TrendResponse>("/api/logs/analytics/trend", params);
}

export function fetchSeverityDistribution(params: AnalyticsParams) {
  return fetchAnalytics<SeverityDistributionResponse>(
    "/api/logs/analytics/severity-distribution",
    params,
  );
}

export async function fetchTopSources(params: TopSourcesParams) {
  const q = buildSearchParams({
    start_date: params.startDate,
    end_date: params.endDate,
    severity: params.severity || undefined,
    source: params.source,
    limit: params.limit ?? 5,
  });
  const res = await fetch(
    `${apiBaseUrl}/api/logs/analytics/top-sources${q}`,
    { cache: "no-store" },
  );
  return parseJson<TopSourcesResponse>(res);
}
