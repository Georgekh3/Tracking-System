import type { LucideIcon } from "lucide-react";

export function StatCard({
  title,
  value,
  detail,
  icon: Icon
}: {
  title: string;
  value: string | number;
  detail?: string;
  icon: LucideIcon;
}) {
  return (
    <div className="panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-slate-500">{title}</div>
          <div className="mt-2 text-2xl font-semibold text-ink">{value}</div>
          {detail ? <div className="mt-1 text-sm text-slate-500">{detail}</div> : null}
        </div>
        <div className="rounded-md bg-atelier-mist p-2 text-atelier-teal">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
