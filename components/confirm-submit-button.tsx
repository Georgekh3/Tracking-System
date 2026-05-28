"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function ConfirmSubmitButton({
  message,
  children,
  className,
  icon: Icon
}: {
  message: string;
  children: ReactNode;
  className: string;
  icon?: LucideIcon;
}) {
  return (
    <button
      className={className}
      type="submit"
      onClick={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
    >
      {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}
