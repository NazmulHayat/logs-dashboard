import type { Severity } from "@/lib/types";
import { SEVERITY_CLASSES } from "@/lib/types";

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={`severity-badge ${SEVERITY_CLASSES[severity]}`}>{severity}</span>
  );
}
