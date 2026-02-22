'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { fmtIDR } from '@/app/db/utils/format';
import { AdminOrders } from './api';

const STATUS = [
  { value: '', label: 'Semua status' },
  { value: 'awaiting_payment', label: 'Awaiting payment' },
  { value: 'paid', label: 'Paid' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
];

export default function AdminOrdersPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const page = Number(sp.get('page') || 1);
  const limit = 20;

  const [q, setQ] = useState(sp.get('q') || '');
  const [status, setStatus] = useState(sp.get('status') || '');
  const [from, setFrom] = useState(sp.get('from') || '');
  const [to, setTo] = useState(sp.get('to') || '');

  const pages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total]);

  async function load() {
    setLoading(true);
    try {
      const { items, total: t } = await AdminOrders.list({ q, status, from, to, page, limit });
      setRows(items || []);
      setTotal(t || 0);
    } catch (e) {
      alert(e.message || 'Gagal memuat');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page]); // load tiap pindah page

  function applyFilter(e) {
    e?.preventDefault?.();
    const usp = new URLSearchParams({ page: '1' });
    if (q) usp.set('q', q);
    if (status) usp.set('status', status);
    if (from) usp.set('from', from);
    if (to) usp.set('to', to);
    router.replace(`/admin/orders?${usp.toString()}`);
    // load manual biar instan
    AdminOrders.list(Object.fromEntries(usp)).then(({ items, total: t }) => {
      setRows(items || []); setTotal(t || 0);
    }).catch(err => alert(err.message));
  }

  return (
    <div className="p-6 space-y-5">
      <h1 className="text-xl font-semibold">Orders</h1>

      <form onSubmit={applyFilter} className="rounded-xl border bg-white p-4 grid md:grid-cols-5 gap-3">
        <input value={q} onChange={e=> setQ(e.target.value)} placeholder="Cari orderNo atau email user" className="rounded border px-3 py-2 md:col-span-2" />
        <select value={status} onChange={e=> setStatus(e.target.value)} className="rounded border px-3 py-2">
          {STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <input type="date" value={from} onChange={e=> setFrom(e.target.value)} className="rounded border px-3 py-2" />
        <input type="date" value={to} onChange={e=> setTo(e.target.value)} className="rounded border px-3 py-2" />
        <div className="md:col-span-5 flex gap-2">
          <button className="rounded bg-orange-600 text-white px-4 py-2">Terapkan</button>
          <button type="button" onClick={()=> { setQ(''); setStatus(''); setFrom(''); setTo(''); router.replace('/admin/orders?page=1'); load(); }} className="rounded border px-4 py-2">Reset</button>
        </div>
      </form>

      <div className="rounded-xl border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-zinc-700">
            <tr>
              <th className="text-left px-4 py-2">Order</th>
              <th className="text-left px-4 py-2">User</th>
              <th className="text-left px-4 py-2">Tanggal</th>
              <th className="text-left px-4 py-2">Total</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="text-left px-4 py-2">Payment</th>
              <th className="text-left px-4 py-2">Resi</th>
              <th className="text-left px-4 py-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t">
                  <td className="px-4 py-3"><div className="h-4 w-40 bg-zinc-200 animate-pulse rounded" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-28 bg-zinc-200 animate-pulse rounded" /></td>
                  <td className="px-4 py-3"><div className="h-8 w-24 bg-zinc-200 animate-pulse rounded" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-20 bg-zinc-200 animate-pulse rounded" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-16 bg-zinc-200 animate-pulse rounded" /></td>
                  <td className="px-4 py-3"><div className="h-8 w-24 bg-zinc-200 animate-pulse rounded" /></td>
                </tr>
              ))

            ) : rows.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-zinc-500">Tidak ada data</td></tr>
            ) : rows.map(o => (
              <tr key={o._id} className="border-t">
                <td className="px-4 py-2">
                  <div className="font-medium">{o.orderNo}</div>
                </td>
                <td className="px-4 py-2">
                  <div>{o.user?.name || '-'}</div>
                  <div className="text-zinc-500 text-xs">{o.user?.email || '-'}</div>
                </td>
                <td className="px-4 py-2">{o.placedAt ? new Date(o.placedAt).toLocaleString('id-ID') : '-'}</td>
                <td className="px-4 py-2">{fmtIDR(o.total)}</td>
                <td className="px-4 py-2"><StatusBadge value={o.status} /></td>
                <td className="px-4 py-2">{o.payment?.status || '-'}</td>
                <td className="px-4 py-2">{o.shipment?.trackingNo || '-'}</td>
                <td className="px-4 py-2">
                  <Link href={`/admin/orders/${o._id}`} className="text-orange-600 hover:underline">Detail</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* pagination sederhana */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-zinc-600">Total: {total}</div>
        <div className="flex gap-2">
          <button disabled={page<=1} onClick={()=> router.replace(`/admin/orders?page=${page-1}`)} className="rounded border px-3 py-1 disabled:opacity-50">Prev</button>
          <div className="text-sm px-2 py-1">Page {page} / {pages}</div>
          <button disabled={page>=pages} onClick={()=> router.replace(`/admin/orders?page=${page+1}`)} className="rounded border px-3 py-1 disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ value }) {
  const map = {
    awaiting_payment: 'bg-amber-100 text-amber-800',
    paid: 'bg-emerald-100 text-emerald-700',
    processing: 'bg-blue-100 text-blue-700',
    shipped: 'bg-indigo-100 text-indigo-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-zinc-200 text-zinc-700',
    refunded: 'bg-purple-100 text-purple-700',
  };
  const cls = map[value] || 'bg-zinc-100 text-zinc-700';
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${cls}`}>{value}</span>;
}
