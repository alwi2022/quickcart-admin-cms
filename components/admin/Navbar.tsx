'use client';
import Link from 'next/link';
import LogoutButton from '../LogoutButton';

export default function AdminNavbar() {
  return (
    <header className="sticky top-0 z-[70] bg-white border-b border-zinc-200">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        <Link href="/admin" className="font-semibold">GalaTech Admin</Link>
        <nav className="text-sm flex items-center gap-4">
          <Link href="/" className="hover:underline">Lihat Toko</Link>
          <LogoutButton className='hover:underline'/>
        </nav>
      </div>
    </header>
  );
}
