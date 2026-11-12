import { LoginForm } from "./login-form";

const ERRORS: Record<string, string> = {
  "not-allowed": "That account is not allowed to use this workspace.",
  "link-failed":
    "That sign-in link did not work. It may have expired, or been opened in a different browser. Request a new one.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const errorMessage = error ? ERRORS[error] : undefined;

  return (
    <div className="flex min-h-screen items-center justify-center bg-plum px-4 py-8">
      <main className="flex w-full max-w-[420px] flex-col gap-5 rounded-3xl bg-surface px-8 py-10 shadow-2xl">
        <div>
          <p className="flex items-center gap-3 font-display text-lg font-bold">
            <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold text-plum">T</span>
            Content Manager
          </p>
          <h1 className="mt-6 font-display text-3xl font-bold">Sign in</h1>
          <p className="mt-2 text-muted">
            Enter your email and we will send you a sign-in link. No password
            needed.
          </p>
        </div>
        {errorMessage ? (
          <p role="alert" className="rounded-lg bg-warn-soft px-4 py-3 text-sm text-warn">
            {errorMessage}
          </p>
        ) : null}
        <LoginForm />
        <p className="border-t border-line pt-4 text-sm text-muted">
          This is a private workspace. Only the owner&apos;s email address can
          sign in.
        </p>
      </main>
    </div>
  );
}
