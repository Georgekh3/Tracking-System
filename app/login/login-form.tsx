"use client";

import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { loginAction, type LoginState } from "@/lib/actions/auth";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.error}
        </div>
      ) : null}

      <div className="space-y-1.5">
        <label className="field-label" htmlFor="email">
          Email
        </label>
        <input
          className="field-input"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>

      <div className="space-y-1.5">
        <label className="field-label" htmlFor="password">
          Password
        </label>
        <input
          className="field-input"
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>

      <button className="btn-primary w-full" type="submit" disabled={pending}>
        <LogIn className="h-4 w-4" aria-hidden="true" />
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
