import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 text-center">
        <h1 className="text-2xl font-semibold text-zinc-900">404 - Page Not Found</h1>
        <p className="mt-2 text-sm text-zinc-600">Halaman admin yang kamu cari tidak ditemukan.</p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <Link href="/admin" className="rounded bg-orange-600 px-4 py-2 text-sm text-white hover:bg-orange-700">
            Dashboard
          </Link>
          <Link href="/login" className="rounded border px-4 py-2 text-sm hover:bg-zinc-50">
            Login
          </Link>
        </div>
      </div>
    </main>
  );
}
