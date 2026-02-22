//components/authcard
"use client";

import React, { useId, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from 'next/navigation';
import toast from "react-hot-toast";

const GoogleIcon = React.memo(function GoogleIcon(props) {
  return (
    <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true" {...props}>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.8 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C33.5 6.3 28.9 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16.4 18 14 24 14c3 0 5.7 1.1 7.8 3l5.7-5.7C33.5 6.3 28.9 4 24 4 16.4 4 9.9 8.4 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.3-5.3l-6.1-5c-2 1.4-4.6 2.3-7.2 2.3-5.3 0-9.7-3.4-11.3-8.1l-6.4 4.9C9.9 39.6 16.4 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1 2.8-3.2 5.1-5.9 6.4l6.1 5C38.7 36.5 44 31 44 24c0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
});

const isValidEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim());

export default function AuthCard({ mode = "register" }) {
  const isRegister = mode === "register";
  const router = useRouter();
  const sp = useSearchParams();


  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setLoading] = useState(false);

  const emailId = useId();
  const pwId = useId();
  const pw2Id = useId();
  const errorId = useId();
  const successId = useId();

  const emailValid = useMemo(() => isValidEmail(email), [email]);
  const pwValid = useMemo(() => pw.length >= 8, [pw]);
  const pwMatch = useMemo(() => !isRegister || pw === pw2, [isRegister, pw, pw2]);
  const canSubmit = emailValid && pwValid && pwMatch && !isLoading;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!emailValid) return setError("Masukkan e-mail yang valid.");
    if (!pwValid) return setError("Password minimal 8 karakter.");
    if (!pwMatch) return setError("Konfirmasi password tidak cocok.");
    setError("");  setLoading(true);
    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const payload = isRegister ? { name: email.split('@')[0], email, password: pw } : { email, password: pw };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        // Cookie HttpOnly akan di-set oleh server via Set-Cookie
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Gagal memproses. Coba lagi.');
        return;
      }

      toast.success("Berhasil memproses. Silakan cek email untuk verifikasi.");

      // Redirect ke next (jika ada), fallback ke beranda / profile
      const next = sp.get("next"); // dari middleware (jika ada)
      const target = next && next.startsWith("/") ? next : "/profile"; // fallback ke /profile
      setTimeout(() => {
        router.replace(target);
        // Opsional: jika kamu menampilkan nama user di Navbar (server component), panggil refresh:
        router.refresh();
      }, 600);
    } catch (err) {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  function onGoogleClick() {
    if (isLoading) return;
    setLoading(true);
    try {

    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="w-full max-w-md rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200 p-6 md:p-7">
      {/* Tabs (route terpisah, ringan untuk SEO & PageSpeed) */}
      <nav className="mb-4 grid grid-cols-2 rounded-lg bg-zinc-100 p-1" aria-label="Auth tabs">
        <Link
          href="/login"
          prefetch={false}
          className={`text-center py-2 text-sm font-medium rounded-md transition ${isRegister ? "text-zinc-600" : "bg-white shadow-sm text-zinc-900"
            }`}
          aria-current={!isRegister ? "page" : undefined}
        >
          Masuk
        </Link>
        <Link
          href="/register"
          prefetch={false}
          className={`text-center py-2 text-sm font-medium rounded-md transition ${isRegister ? "bg-white shadow-sm text-zinc-900" : "text-zinc-600"
            }`}
          aria-current={isRegister ? "page" : undefined}
        >
          Daftar
        </Link>
      </nav>

      <h1 className="text-xl text-center font-semibold text-zinc-900">
        {isRegister ? "Daftar Sekarang" : "Masuk ke Akunmu"}
      </h1>

      <p className="mt-1 text-sm text-center text-zinc-600">
        {isRegister ? (
          <>Sudah punya akun?{" "}
            <Link href="/login" prefetch={false} className="text-orange-600 hover:underline">Masuk</Link>
          </>
        ) : (
          <>Belum punya akun?{" "}
            <Link href="/register" prefetch={false} className="text-orange-600 hover:underline">Daftar</Link>
          </>
        )}
      </p>

      <button
        type="button"
        onClick={onGoogleClick}
        disabled={isLoading}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm font-medium hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/30 disabled:opacity-60"
      >
        <GoogleIcon />
        <span>{isRegister ? "Daftar" : "Masuk"} dengan Google</span>
      </button>

      <div className="my-5 flex items-center gap-3" aria-hidden="true">
        <div className="h-px flex-1 bg-zinc-200" /><span className="text-xs text-zinc-500">atau</span><div className="h-px flex-1 bg-zinc-200" />
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-3" autoComplete="on">
        <div>
          <label htmlFor={emailId} className="block text-sm font-medium text-zinc-800">E-mail</label>
          <input
            id={emailId}
            name="email"
            type="email"
            inputMode="email"
            autoComplete={isRegister ? "email" : "username"}
            enterKeyHint="next"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Contoh: email@gala.com"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            aria-invalid={!!error && !emailValid}
            aria-describedby={error ? errorId : undefined}
            required
          />
        </div>

        <div>
          <label htmlFor={pwId} className="block text-sm font-medium text-zinc-800">Password</label>
          <div className="mt-1 relative">
            <input
              id={pwId}
              name="password"
              type={showPw ? "text" : "password"}
              autoComplete={isRegister ? "new-password" : "current-password"}
              enterKeyHint={isRegister ? "next" : "go"}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Minimal 8 karakter"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 pr-12 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              aria-invalid={!!error && !pwValid}
              aria-describedby={error ? errorId : undefined}
              required
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute inset-y-0 right-0 px-3 text-xs text-zinc-600 hover:text-zinc-900"
              aria-label={showPw ? "Sembunyikan password" : "Tampilkan password"}
            >
              {showPw ? "Sembunyi" : "Tampil"}
            </button>
          </div>
        </div>

        {isRegister && (
          <div>
            <label htmlFor={pw2Id} className="block text-sm font-medium text-zinc-800">Konfirmasi Password</label>
            <input
              id={pw2Id}
              name="passwordConfirm"
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              enterKeyHint="go"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              placeholder="Ulangi password"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              aria-invalid={!!error && !pwMatch}
              aria-describedby={error ? errorId : undefined}
              required
            />
          </div>
        )}

        {/* Live region untuk error agar SR membacakan perubahan tanpa ubah layout */}
        <p id={errorId} className="text-xs text-red-600 min-h-[1rem]" role="status" aria-live="polite">
          {error || ""}
        </p>

        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-2 w-full rounded-lg bg-orange-600 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
        >
          {isLoading ? "Memproses..." : isRegister ? "Daftar" : "Masuk"}
        </button>
      </form>

      <p className="mt-4 text-[12px] leading-relaxed text-zinc-500">
        Dengan {isRegister ? "mendaftar" : "masuk"}, saya menyetujui{" "}
        <Link href="#" prefetch={false} className="text-orange-600 hover:underline">Syarat &amp; Ketentuan</Link>{" "}
        serta{" "}
        <Link href="#" prefetch={false} className="text-orange-600 hover:underline">Kebijakan Privasi</Link>{" "}
        GalaTech.com
      </p>
    </section>
  );
}
