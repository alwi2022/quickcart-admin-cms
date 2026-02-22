import Image from "next/image";
import Link from "next/link";
import { assets } from "@/assets/assets";

export default function AuthLayout({ children }) {
  const year = new Date().getFullYear();

  return (
    <main className="min-h-screen bg-white">
      {/* Brand header */}
      <div className="flex items-center justify-center py-6">
        <Link
          href="/"
          prefetch={false}
          className="inline-flex items-center gap-2"
          aria-label="Kembali ke beranda GalaTech"
        >
          <Image src={assets.logo} alt="GalaTech" width={150} height={40} priority />
        </Link>
      </div>

      {/* Content (single column, center) */}
      <div className="mx-auto w-full max-w-6xl px-6 pb-14">
        <div className="flex justify-center">
          {children}
        </div>
      </div>

      {/* Footer mini */}
      <footer className="py-6 text-center text-sm text-zinc-500">
        © {year} GalaTech •{" "}
        <Link href="#" prefetch={false} className="hover:underline">
          Pusat Bantuan
        </Link>
      </footer>
    </main>
  );
}
