export type Severity = "DEBUG" | "INFO" | "WARNING" | "ERROR";

export const SEVERITIES: Severity[] = [
  "DEBUG",
  "INFO",
  "WARNING",
  "ERROR",
];

export type LogRecord = {
  id: number;
  timestamp: string;
  severity: Severity;
  source: string;
  message: string;
  created_at: string;
  updated_at: string;
};

export type LogListResponse = {
  items: LogRecord[];
  total: number;
  page: number;
  page_size: number;
};

export type TrendPoint = {
  day: string;
  count: number;
};

export type TrendResponse = {
  points: TrendPoint[];
};

export type SummaryResponse = {
  total_logs: number;
  error_logs: number;
  error_rate: number;
  unique_sources: number;
};

export type TopSourceItem = {
  source: string;
  count: number;
};

export type TopSourcesResponse = {
  items: TopSourceItem[];
};

export type SeverityCount = {
  severity: string;
  count: number;
};

export type SeverityDistributionResponse = {
  items: SeverityCount[];
};

export const SORTABLE_FIELDS = [
  "timestamp",
  "severity",
  "source",
  "id",
] as const;

export type SortableField = (typeof SORTABLE_FIELDS)[number];

export const SEVERITY_CLASSES: Record<Severity, string> = {
  DEBUG: "severity-debug",
  INFO: "severity-info",
  WARNING: "severity-warning",
  ERROR: "severity-error",
};
