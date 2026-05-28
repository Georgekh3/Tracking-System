"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type PasswordInputProps = {
  id?: string;
  name: string;
  autoComplete?: string;
  minLength?: number;
  placeholder?: string;
  required?: boolean;
};

export function PasswordInput({
  id,
  name,
  autoComplete,
  minLength,
  placeholder,
  required
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);
  const inputId = id ?? name;
  const Icon = isVisible ? EyeOff : Eye;

  return (
    <div className="relative">
      <input
        className="field-input pr-11"
        id={inputId}
        name={name}
        type={isVisible ? "text" : "password"}
        autoComplete={autoComplete}
        minLength={minLength}
        placeholder={placeholder}
        required={required}
      />
      <button
        aria-label={isVisible ? "Hide password" : "Show password"}
        className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 hover:bg-atelier-mist hover:text-atelier-teal focus:outline-none focus:ring-2 focus:ring-atelier-teal"
        title={isVisible ? "Hide password" : "Show password"}
        type="button"
        onClick={() => setIsVisible((current) => !current)}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
