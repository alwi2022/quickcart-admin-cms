'use client';
import Navbar from '@/components/admin/Navbar';
import Sidebar from '@/components/admin/Sidebar';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Cek sesi & role admin
        const res = await fetch('/api/me', { credentials: 'include', cache: 'no-store' });
        if (!res.ok) { router.replace('/login?next=/admin'); return; }
        const data = await res.json();
        if (!data?.user?.roles?.includes('admin')) { router.replace('/login?next=/admin'); return; }
        if (mounted) setOk(true);
      } catch {
        router.replace('/login?next=/admin');
      }
    })();
    return () => { mounted = false; };
  }, [router]);

  if (!ok) return null;

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
