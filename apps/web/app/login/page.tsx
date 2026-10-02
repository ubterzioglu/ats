import Link from "next/link";

import { login, signup } from "./actions";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ message: string }>;
}) {
  const { message } = await searchParams;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-4 py-12">
      <Link
        href="/"
        className="font-mono text-sm font-medium tracking-tight transition-colors hover:text-accent"
      >
        ats readability
      </Link>

      <div className="sheet mt-6 p-7">
        <h1 className="text-xl font-semibold">Sign in</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          Your CV is read and scored in your browser. The account only keeps your share links.
        </p>

        <form className="mt-7 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="rail-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              className="field"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="rail-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              required
              className="field"
            />
          </div>

          {message ? (
            <p
              role="alert"
              className="rounded-control border border-caution/35 bg-caution/[0.07] px-3.5 py-3 text-sm text-caution"
            >
              {message}
            </p>
          ) : null}

          <button formAction={login} className="btn mt-2">
            Sign in
          </button>

          <button formAction={signup} className="btn-quiet">
            Create an account
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        <Link href="/" className="underline underline-offset-2 transition-colors hover:text-ink">
          What this checks
        </Link>
      </p>
    </div>
  );
}
