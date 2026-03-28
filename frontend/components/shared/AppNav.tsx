"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/logs", label: "Logs", match: (p: string) => p.startsWith("/logs") },
  {
    href: "/dashboard",
    label: "Dashboard",
    match: (p: string) => p === "/dashboard" || p.startsWith("/dashboard/"),
  },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="mb-5 border-b border-border bg-surface shadow-[inset_0_1px_0_rgb(255_255_255_/_0.85)]">
      <div className="mx-auto flex max-w-[min(1520px,calc(100vw-40px))] items-center justify-between gap-6 px-[clamp(1.25rem,3vw,2.5rem)] py-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted">
            Zeroboard
          </span>
          <span className="text-[1.0625rem] font-bold text-primary">Project</span>
        </div>
        <nav
          className="flex items-center gap-1.5 rounded-full border border-border bg-[#fdfdfe] p-1"
          aria-label="Main"
        >
          {links.map(({ href, label, match }) => (
            <Link
              key={href}
              href={href}
              data-active={match(pathname) ? "true" : "false"}
              prefetch={false}
              className="rounded-full px-4 py-[9px] text-[0.9375rem] text-muted no-underline transition-[background,color,box-shadow] duration-150 hover:bg-page hover:text-primary hover:no-underline data-[active=true]:bg-[color-mix(in_srgb,var(--color-btn-primary)_12%,white)] data-[active=true]:font-semibold data-[active=true]:text-primary data-[active=true]:shadow-[0_1px_2px_rgba(15,23,42,0.08)]"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
