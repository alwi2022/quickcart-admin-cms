'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminProductsPage() {
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [data, setData] = useState({ items: [], page: 1, pages: 1, total: 0 });

  async function fetchData(page = 1) {
    setLoading(true);
    const res = await fetch(`/api/admin/products?q=${encodeURIComponent(q)}&page=${page}`, { credentials: 'include', cache: 'no-store' });
    const json = await res.json();
    setData(json);
    setLoading(false);
  }

  useEffect(()=> { fetchData(1); /* eslint-disable-next-line */ }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Products</h1>
        <Link href="/admin/products/new" className="rounded bg-orange-600 text-white px-3 py-2 text-sm">New Product</Link>
      </div>

      <div className="rounded-xl border bg-white p-3 flex items-center gap-2">
        <input
          value={q} onChange={e => setQ(e.target.value)}
          placeholder="Search name/brand/category..."
          className="flex-1 rounded border px-3 py-2 text-sm"
        />
        <button onClick={()=> fetchData(1)} className="rounded border px-3 py-2 text-sm">Search</button>
      </div>

      <div className="rounded-xl border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="text-left px-3 py-2">Name</th>
              <th className="text-left px-3 py-2">Brand</th>
              <th className="text-left px-3 py-2">Category</th>
              <th className="text-right px-3 py-2">Price</th>
              <th className="text-center px-3 py-2">Status</th>
              <th className="text-right px-3 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-zinc-500">Loading...</td></tr>
            ) : data.items.length ? data.items.map(p => (
              <tr key={p._id} className="border-t">
                <td className="px-3 py-2">{p.name}</td>
                <td className="px-3 py-2">{p.brand?.name ?? '-'}</td>
                <td className="px-3 py-2">{p.category?.name ?? '-'}</td>
                <td className="px-3 py-2 text-right">Rp {Intl.NumberFormat('id-ID').format(p.sale_price ?? p.price ?? 0)}</td>
                <td className="px-3 py-2 text-center">
                  <span className={`px-2 py-1 rounded text-xs ${p.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-zinc-100 text-zinc-700'}`}>{p.status}</span>
                </td>
                <td className="px-3 py-2 text-right">
                  <Link href={`/admin/products/${p._id}`} className="rounded border px-2 py-1">Edit</Link>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-zinc-500">No data</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {data.pages > 1 && (
        <div className="flex justify-end gap-2">
          <button disabled={data.page <= 1} onClick={()=> fetchData(data.page - 1)} className="rounded border px-3 py-1.5 disabled:opacity-50">Prev</button>
          <div className="text-sm self-center">Page {data.page} / {data.pages}</div>
          <button disabled={data.page >= data.pages} onClick={()=> fetchData(data.page + 1)} className="rounded border px-3 py-1.5 disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  );
}
