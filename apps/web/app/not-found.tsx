import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70dvh] w-full max-w-2xl flex-col justify-center px-4 py-12 sm:px-6">
      <p className="readout">404</p>
      <h1 className="mt-2 text-2xl font-semibold">Nothing here</h1>
      <p className="mt-2 max-w-measure text-sm leading-relaxed text-muted">
        A shared report lives for 30 days and then deletes itself. This one has either expired or never existed.
      </p>
      <p className="mt-6">
        <Link className="btn" href="/">
          Analyze a CV
        </Link>
      </p>
    </main>
  );
}
