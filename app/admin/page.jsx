'use client';
import { useEffect, useState } from 'react';
import StatCard from '@/components/admin/StatCard';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=> {
    let mounted = true;
    (async ()=> {
      try {
        const res = await fetch('/api/admin/stats', { credentials: 'include', cache: 'no-store' });
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        if (mounted) setStats(data);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return ()=> { mounted = false; };
  }, []);

  if (loading) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Orders" value={stats?.orders?.count ?? 0} sub={`Today: ${stats?.orders?.today ?? 0}`} />
        <StatCard title="GMV (IDR)" value={Intl.NumberFormat('id-ID').format(stats?.gmv?.total ?? 0)} sub={`Today: Rp ${Intl.NumberFormat('id-ID').format(stats?.gmv?.today ?? 0)}`} />
        <StatCard title="Products" value={stats?.products ?? 0} />
        <StatCard title="Users" value={stats?.users ?? 0} />
      </div>

      {/* Placeholder grafik/daftar terbaru */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="font-medium mb-3">Latest Orders</div>
          <ul className="text-sm divide-y">
            {stats?.latestOrders?.map(o => (
              <li key={o._id} className="py-2 flex items-center justify-between">
                <div>
                  <div className="font-medium">{o.orderNo}</div>
                  <div className="text-xs text-zinc-500">{o.status} • {new Date(o.createdAt).toLocaleString()}</div>
                </div>
                <div className="font-semibold">Rp {Intl.NumberFormat('id-ID').format(o.pricing?.grandTotal ?? 0)}</div>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="font-medium mb-3">Low Stock (Inventory)</div>
          <ul className="text-sm divide-y">
            {stats?.lowStock?.map(i => (
              <li key={i._id} className="py-2 flex items-center justify-between">
                <div>
                  <div className="font-medium">{i.productName}</div>
                  <div className="text-xs text-zinc-500">SKU {i.sku} • qty {i.qty}</div>
                </div>
                <div className="text-xs">Reorder point: {i.reorderPoint ?? 0}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
