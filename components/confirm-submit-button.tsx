"use client";

import { Archive, RotateCcw, UserCog, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

const icons = {
  archive: Archive,
  restore: RotateCcw,
  userStatus: UserCog
} satisfies Record<string, LucideIcon>;

type ConfirmSubmitIcon = keyof typeof icons;

export function ConfirmSubmitButton({
  message,
  children,
  className,
  icon
}: {
  message: string;
  children: ReactNode;
  className: string;
  icon?: ConfirmSubmitIcon;
}) {
  const Icon = icon ? icons[icon] : null;

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
