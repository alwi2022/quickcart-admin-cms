'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, ok } from '@/app/db/utils/api';


const STATUS = ['', 'active', 'blocked', 'deleted'];
const ROLES = ['', 'customer', 'seller', 'admin'];

export default function AdminUsersPage() {
    const router = useRouter();
    const sp = useSearchParams();

    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState([]);
    const [total, setTotal] = useState(0);
    const page = Number(sp.get('page') || 1);
    const limit = 20;

    const [q, setQ] = useState(sp.get('q') || '');
    const [status, setStatus] = useState(sp.get('status') || '');
    const [role, setRole] = useState(sp.get('role') || '');

    async function load() {
        setLoading(true);
        try {
            const { items, total } = await ok(api.get('/api/admin/users', { params: { q, status, role, page, limit } }));
            setRows(items || []); setTotal(total || 0);
        } catch (e) {
            alert(e.message);
        } finally { setLoading(false); }
    }

    useEffect(() => { load(); /* eslint-disable-next-line */ }, [page]);

    function applyFilter(e) {
        e?.preventDefault?.();
        const usp = new URLSearchParams({ page: '1' });
        if (q) usp.set('q', q);
        if (status) usp.set('status', status);
        if (role) usp.set('role', role);
        router.replace(`/admin/users?${usp.toString()}`);
        ok(api.get('/api/admin/users', { params: Object.fromEntries(usp) })).then(d => {
            setRows(d.items || []); setTotal(d.total || 0);
        }).catch(err => alert(err.message));
    }

    async function ban(u) { await ok(api.patch(`/api/admin/users/${u._id}`, { status: 'blocked' })); load(); }
    async function unban(u) { await ok(api.patch(`/api/admin/users/${u._id}`, { status: 'active' })); load(); }
    async function del(u) { if (!confirm('Hapus user ini?')) return; await ok(api.delete(`/api/admin/users/${u._id}`)); load(); }

    return (
        <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Users</h1>
                <Link href="/admin/users/new" className="rounded bg-orange-600 text-white px-4 py-2 text-sm">+ New</Link>
            </div>

            <form onSubmit={applyFilter} className="rounded-xl border bg-white p-4 grid md:grid-cols-4 gap-3">
                <input value={q} onChange={e => setQ(e.target.value)} placeholder="Cari nama/email/phone" className="rounded border px-3 py-2 md:col-span-2" />
                <select value={status} onChange={e => setStatus(e.target.value)} className="rounded border px-3 py-2">
                    {STATUS.map(s => <option key={s} value={s}>{s || 'Semua status'}</option>)}
                </select>
                <select value={role} onChange={e => setRole(e.target.value)} className="rounded border px-3 py-2">
                    {ROLES.map(s => <option key={s} value={s}>{s || 'Semua roles'}</option>)}
                </select>
                <div className="md:col-span-5 flex gap-2">
          <button className="rounded bg-orange-600 text-white px-4 py-2">Terapkan</button>
          <button type="button" onClick={()=> { setQ(''); setStatus(''); setRole(''); router.replace('/admin/users?page=1'); load(); }} className="rounded border px-4 py-2">Reset</button>
        </div>  
            </form>

            <div className="rounded-xl border bg-white overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-zinc-50">
                        <tr>
                            <th className="text-left px-4 py-2">User</th>
                            <th className="text-left px-4 py-2">Phone</th>
                            <th className="text-left px-4 py-2">Roles</th>
                            <th className="text-left px-4 py-2">Status</th>
                            <th className="text-left px-4 py-2">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan={5} className="px-4 py-8 text-center">Memuat…</td></tr> :
                            rows.length === 0 ? <tr><td colSpan={5} className="px-4 py-8 text-center">Tidak ada data</td></tr> :
                                rows.map(u => (
                                    <tr key={u._id} className="border-t">
                                        <td className="px-4 py-2">
                                            <div className="font-medium">{u.name || '-'}</div>
                                            <div className="text-xs text-zinc-500">{u.email}</div>
                                        </td>
                                        <td className="px-4 py-2">{u.phone || '-'}</td>
                                        <td className="px-4 py-2">{(u.roles || []).join(', ')}</td>
                                        <td className="px-4 py-2">{u.status}</td>
                                        <td className="px-4 py-2 flex gap-2">
                                            <Link href={`/admin/users/${u._id}`} className="text-orange-600">Edit</Link>
                                            {u.status !== 'blocked' ? (
                                                <button onClick={() => ban(u)} className="text-amber-600">Ban</button>
                                            ) : (
                                                <button onClick={() => unban(u)} className="text-emerald-600">Unban</button>
                                            )}
                                            <button onClick={() => del(u)} className="text-red-600">Hapus</button>
                                        </td>
                                    </tr>
                                ))}
                    </tbody>
                </table>
            </div>

            {/* pagination minimal */}
            <div className="flex justify-end gap-2">
                <button disabled={page <= 1} onClick={() => router.replace(`/admin/users?page=${page - 1}`)} className="rounded border px-3 py-1 disabled:opacity-50">Prev</button>
                <button onClick={() => router.replace(`/admin/users?page=${page + 1}`)} className="rounded border px-3 py-1">Next</button>
            </div>
        </div>
    );
}
