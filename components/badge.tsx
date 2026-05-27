import { clsx } from "clsx";

const variants = {
  neutral: "bg-slate-100 text-slate-700",
  green: "bg-emerald-100 text-emerald-800",
  gold: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-800",
  teal: "bg-teal-100 text-teal-800"
};

export function Badge({
  children,
  variant = "neutral"
}: {
  children: React.ReactNode;
  variant?: keyof typeof variants;
}) {
  return (
    <span className={clsx("inline-flex rounded-md px-2 py-1 text-xs font-medium", variants[variant])}>
      {children}
    </span>
  );
}
