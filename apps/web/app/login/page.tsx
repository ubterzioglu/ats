import { login, signup } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message: string }>;
}) {
  const { message } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="sheet w-full max-w-sm p-8">
        <div className="mb-8">
          <h1 className="text-xl font-medium mb-2">Sign in to ATS</h1>
          <p className="text-sm text-muted">Enter your email and password below</p>
        </div>

        <form className="flex flex-col gap-4">
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
          
          <div className="flex flex-col gap-1.5 mb-2">
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

          <button formAction={login} className="btn">
            Sign In
          </button>
          
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-line" />
            </div>
            <div className="relative flex justify-center text-xs text-muted">
              <span className="bg-sheet px-2">or</span>
            </div>
          </div>

          <button formAction={signup} className="btn-quiet w-full">
            Create an account
          </button>

          {message && (
            <div className="mt-4 rounded-sheet border border-caution bg-caution/10 p-3 text-sm text-caution">
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
