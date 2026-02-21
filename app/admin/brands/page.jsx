//app/admin/brands/page.jsx
'use client';

import { api, ok } from '@/app/db/utils/api';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

function toSlug(s = '') {
    return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}

export default function AdminBrandsPage() {
    const router = useRouter();
    const sp = useSearchParams();
    const [q, setQ] = useState(sp.get('q') || '');
    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState([]);
    const page = Number(sp.get('page') || 1);
    const limit = 6; // jumlah item per halaman
    const [total, setTotal] = useState(0);


    const [editing, setEditing] = useState(null); // id | 'new' | null
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [logo, setLogo] = useState('');            // simpan URL saja
    const [logoPid, setLogoPid] = useState('');      // optional: public_id untuk destroy
    const [country, setCountry] = useState('');
    const [status, setStatus] = useState('active');

    async function load(p = page) {
        setLoading(true);
        try {
            const { items } = await ok(api.get('/api/admin/brands', { params: { page: p, limit, q } }));
            setRows(items || []);
            setTotal(total || 0);

        } catch (e) { alert(e.message); } finally { setLoading(false); }
    }
    useEffect(() => { load(); }, [page]);

    function startNew() {
        setEditing('new');
        setName(''); setSlug('');
        setLogo(''); setLogoPid('');
        setCountry(''); setStatus('active');
    }
    function startEdit(b) {
        setEditing(b._id);
        setName(b.name);
        setSlug(b.slug);
        setLogo(b.logo_url || '');
        setLogoPid(b.logo_public_id || '');
        setLogoPid('');
        setCountry(b.country || '');
        setStatus(b.status || 'active');
    }

    async function handleUpload(file) {
        if (!file) return;
        try {
            // pakai folder khusus brands; signer kamu sudah support override folder
            const sigRes = await fetch('/api/admin/uploads/cloudinary-sign', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    folder: 'galatech/brands',
                    public_id: `brand-${toSlug(name || 'untitled')}-${Date.now()}`
                })
            });
            const sig = await sigRes.json();
            if (!sigRes.ok) throw new Error(sig?.error || 'Sign gagal');

            const fd = new FormData();
            fd.append('file', file);
            fd.append('api_key', sig.apiKey);
            fd.append('timestamp', String(sig.timestamp));
            if (sig.folder) fd.append('folder', sig.folder);
            if (sig.public_id) fd.append('public_id', sig.public_id);
            if (sig.eager) fd.append('eager', sig.eager);
            fd.append('signature', sig.signature);

            const uploadUrl = `https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`;
            const up = await fetch(uploadUrl, { method: 'POST', body: fd });
            const uj = await up.json();
            if (!up.ok) throw new Error(uj?.error?.message || 'Upload gagal');

            setLogo(uj.secure_url || uj.url || '');
            setLogoPid(uj.public_id || '');
        } catch (e) {
            alert(e.message || 'Upload gagal');
        }
    }

    async function removeLogo() {
        // opsional: hapus file di Cloudinary kalau kita tahu public_id
        if (logoPid) {
            try {
                await fetch('/api/admin/uploads/cloudinary-destroy', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ public_id: logoPid })
                });
            } catch { }
        }
        setLogo('');
        setLogoPid('');
    }

    async function save(e) {
        e.preventDefault();
        const payload = {
            name,
            slug: slug || toSlug(name),
            logo_url: logo,          // simpan URL hasil upload
            logo_public_id: logoPid, // kalau nanti mau simpan public_id juga: logo_public_id: logoPid,
            country,
            status
        };
        try {
            if (editing === 'new') await ok(api.post('/api/admin/brands', payload));
            else await ok(api.patch(`/api/admin/brands/${editing}`, payload));
            setEditing(null); load();
        } catch (e) { alert(e.message); }
    }

    async function remove(b) {
        if (!confirm(`Hapus brand "${b.name}"?`)) return;
        try { await ok(api.delete(`/api/admin/brands/${b._id}`)); load(); }
        catch (e) { alert(e.message); }
    }

    return (
        <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Brands</h1>
                <button onClick={startNew} className="rounded bg-orange-600 text-white px-4 py-2 text-sm">+ New</button>
            </div>

            {editing && (
                <form onSubmit={save} className="rounded-xl border bg-white p-4 grid md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                        <label className="text-sm">Name</label>
                        <input value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" required />
                    </div>
                    <div>
                        <label className="text-sm">Slug</label>
                        <input value={slug} onChange={e => setSlug(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-sm">Logo</label>
                        <div className="mt-1 flex items-center gap-3">
                            {logo ? (
                                <div className="relative w-24 h-24 overflow-hidden rounded border">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={logo} alt={name} className="w-full h-full object-contain bg-white" />
                                    <button
                                        type="button"
                                        onClick={removeLogo}
                                        className="absolute top-1 right-1 text-xs bg-white/90 border px-1 rounded"
                                        title="Hapus logo"
                                    >
                                        ×
                                    </button>
                                </div>
                            ) : (
                                <label className="w-24 h-24 rounded border border-dashed grid place-items-center text-xs cursor-pointer hover:bg-zinc-50">
                                    <input type="file" hidden accept="image/*" onChange={(e) => handleUpload(e.target.files?.[0])} />
                                    + Upload
                                </label>
                            )}
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-1">Gunakan rasio horizontal (mis. 3:1) bila tersedia.</p>
                    </div>
                    <div>
                        <label className="text-sm">Country</label>
                        <input value={country} onChange={e => setCountry(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" />
                    </div>
                    <div>
                        <label className="text-sm">Status</label>
                        <select value={status} onChange={e => setStatus(e.target.value)} className="mt-1 w-full rounded border px-3 py-2">
                            <option value="active">active</option>
                            <option value="inactive">inactive</option>
                        </select>
                    </div>
                    <div className="md:col-span-3 flex gap-2">
                        <button className="rounded bg-orange-600 text-white px-4 py-2">Save</button>
                        <button type="button" onClick={() => setEditing(null)} className="rounded border px-4 py-2">Cancel</button>
                    </div>
                </form>
            )}

            <div className="rounded-xl border bg-white p-3 flex items-center gap-2">
                <input
                    value={q} onChange={e => setQ(e.target.value)}
                    placeholder="Search name..."
                    className="flex-1 rounded border px-3 py-2 text-sm"
                />
                <button onClick={() => load(1)} className="rounded border px-3 py-2 text-sm">Search</button>
            </div>
            <div className="rounded-xl border bg-white overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-zinc-50">
                        <tr>
                            <th className="text-left px-4 py-2">Name</th>
                            <th className="text-left px-4 py-2">Slug</th>
                            <th className="text-left px-4 py-2">Logo</th>
                            <th className="text-left px-4 py-2">Country</th>
                            <th className="text-left px-4 py-2">Status</th>
                            <th className="text-left px-4 py-2">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            // skeleton saat loading
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
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                                    Belum ada Brand. Klik <b>New</b> untuk menambah.
                                </td>
                            </tr>
                        ) : (
                            rows.map(b => (
                                <tr key={b._id} className="border-t">
                                    <td className="px-4 py-2 font-medium">{b.name}</td>
                                    <td className="px-4 py-2">{b.slug}</td>
                                    <td className="px-4 py-2">
                                        {b.logo_url
                                            ? <img src={b.logo_url} alt={b.name} className="h-8 w-auto max-w-[120px] object-contain bg-white border rounded px-1" />
                                            : '—'}
                                    </td>
                                    <td className="px-4 py-2">{b.country || '—'}</td>
                                    <td className="px-4 py-2">{b.status}</td>
                                    <td className="px-4 py-2 flex gap-3">
                                        <button onClick={() => startEdit(b)} className="text-orange-600">Edit</button>
                                        <button onClick={() => remove(b)} className="text-red-600">Hapus</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
                        {/* Pagination */}
                        <div className="flex justify-end gap-2">
                <button
                    disabled={page <= 1}
                    onClick={() => router.replace(`/admin/brands?page=${page - 1}`)}
                    className="rounded border px-3 py-1 disabled:opacity-50"
                >
                    Prev
                </button>
                <button
                    disabled={page * limit >= total}
                    onClick={() => router.replace(`/admin/brands?page=${page + 1}`)}
                    className="rounded border px-3 py-1 disabled:opacity-50"
                >
                    Next
                </button>
            </div>
        </div>
    );
}
