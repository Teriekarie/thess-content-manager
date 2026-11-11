"use client";

import { useActionState } from "react";
import { sendSignInLink, type LoginState } from "./actions";

const initial: LoginState = { status: "idle", message: "" };

export function LoginForm() {
  const [state, action, pending] = useActionState(sendSignInLink, initial);

  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-semibold">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="min-h-12 rounded-lg border border-line-strong px-3.5"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="min-h-12 rounded-lg bg-accent font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send me a sign-in link"}
      </button>
      <p
        role="status"
        aria-live="polite"
        className={
          state.status === "error"
            ? "text-sm text-[#8a2b1d]"
            : "text-sm text-ok"
        }
      >
        {state.message}
      </p>
    </form>
  );
}
