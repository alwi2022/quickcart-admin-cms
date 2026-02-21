// app/admin/categories/page.jsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { api, ok } from '@/app/db/utils/api';
import { useRouter, useSearchParams } from 'next/navigation';

// util
function toSlug(s = '') {
    return s
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

export default function AdminCategoriesPage() {
    const router = useRouter();
    const sp = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [rows, setRows] = useState([]);
    const [parents, setParents] = useState([]);
    const page = Number(sp.get('page') || 1);
    const limit = 5; // jumlah item per halaman
    const [total, setTotal] = useState(0);

    const [totalPages, setTotalPages] = useState(1);
    // form new/edit
    const [editing, setEditing] = useState(null); // 'new' | id | null
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [slugTouched, setSlugTouched] = useState(false);
    const [images, setImages] = useState([]); // [{url, alt, publicId}]
    const [parentId, setParentId] = useState('');
    const [order, setOrder] = useState(0);
    const [q, setQ] = useState(sp.get('q') || '');

    // ========= DATA =========
    async function load(p = page) {
        setLoading(true);
        try {
            const { items, total } = await ok(api.get('/api/admin/categories', {
                params: { page: p, limit, q }
            }));
            setRows(items || []);
            setTotal(total || 0);
        } catch (e) {
            alert(e.message || 'Gagal memuat kategori');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); /* eslint-disable-next-line */ }, [page]);


    // ========= FORM HELPERS =========
    function startNew() {
        setEditing('new');
        setName('');
        setSlug('');
        setSlugTouched(false);
        setImages([]);
        setParentId('');
        setOrder(0);
    }

    async function startEdit(c) {
        setEditing(c._id);
        setName(c.name || '');
        setSlug(c.slug || '');
        setSlugTouched(true);
        // Normalisasi image → state images: [{ url, alt, publicId }]
        if (typeof c.image === 'string') {
            setImages(c.image ? [{ url: c.image, alt: '', publicId: undefined }] : []);
        } else if (Array.isArray(c.image)) {
            setImages(c.image.map(x =>
                typeof x === 'string'
                    ? { url: x, alt: '', publicId: undefined }
                    : { url: x?.url || '', alt: x?.alt || '', publicId: x?.publicId }
            ));
        } else if (c.image && typeof c.image === 'object') {
            setImages(c.image.url ? [{ url: c.image.url, alt: c.image.alt || '', publicId: c.image.publicId }] : []);
        } else {
            setImages([]);
        }
        setParentId(c.parent_id || '');
        setOrder(c.order || 0);
    }

    // auto slug kalau user belum menyentuh field slug
    useEffect(() => {
        if (!slugTouched) setSlug(toSlug(name));
    }, [name, slugTouched]);

    function cancelEdit() {
        setEditing(null);
        setSaving(false);
    }

    // ========= UPLOAD =========
    async function handleUpload(file) {
        if (!file) return;
        try {
            const sigRes = await fetch('/api/admin/uploads/cloudinary-sign', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    folder: 'galatech/categories',
                    public_id: `cat-${toSlug(name || 'category')}`
                })
            });
            const sig = await sigRes.json();
            if (!sigRes.ok) throw new Error(sig?.error || 'Sign gagal');

            const fd = new FormData();
            fd.append('file', file);
            fd.append('api_key', sig.apiKey);
            fd.append('timestamp', String(sig.timestamp));
            if (sig.folder) fd.append('folder', sig.folder);
            if (sig.eager) fd.append('eager', sig.eager);
            if (sig.public_id) fd.append('public_id', sig.public_id);
            fd.append('signature', sig.signature);

            const uploadUrl = `https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`;
            const up = await fetch(uploadUrl, { method: 'POST', body: fd });
            const uj = await up.json();
            if (!up.ok) throw new Error(uj?.error?.message || 'Upload gagal');

            setImages([{ url: uj.secure_url || uj.url, alt: '', publicId: uj.public_id }]); // overwrite
        } catch (e) {
            alert(e.message || 'Upload gagal');
        }
    }

    function removeImage(i) {
        setImages(prev => prev.filter((_, idx) => idx !== i));
    }

    // ========= SAVE / DELETE =========
    async function save(e) {
        e.preventDefault();
        if (!name.trim()) return alert('Nama wajib diisi');
        setSaving(true);
        const payload = {
            name: name.trim(),
            slug: (slug || toSlug(name)).trim(),
            image: images[0]?.url || null,
            parent_id: parentId || null,
            order: Number.isFinite(+order) ? +order : 0,
        };
        try {
            if (editing === 'new') await ok(api.post('/api/admin/categories', payload));
            else await ok(api.patch(`/api/admin/categories/${editing}`, payload));
            setEditing(null);
            await load();
        } catch (e) {
            alert(e.message || 'Gagal menyimpan');
        } finally {
            setSaving(false);
        }
    }

    async function remove(c) {
        if (!confirm(`Hapus kategori "${c.name}"?`)) return;
        try {
            await ok(api.delete(`/api/admin/categories/${c._id}`));
            await load();
        } catch (e) {
            alert(e.message || 'Gagal menghapus');
        }
    }

    // ========= TREE FLAT =========
    const tree = useMemo(() => {
        const byParent = new Map();
        for (const c of rows) {
            const pid = c.parent_id ? String(c.parent_id) : 'root';
            if (!byParent.has(pid)) byParent.set(pid, []);
            byParent.get(pid).push(c);
        }
        const sort = (arr = []) =>
            arr.sort((a, b) => (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name));
        const build = (pid = 'root', depth = 0) => {
            const list = sort(byParent.get(pid) || []);
            return list.flatMap(c => [{ ...c, _depth: depth }, ...build(String(c._id), depth + 1)]);
        };
        return build('root', 0);
    }, [rows]);

    // ========= UI =========
    return (
        <div className="p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold">Categories</h1>
                    <p className="text-sm text-zinc-500">Kelola kategori beserta hierarchy & urutannya.</p>
                </div>
                <button
                    onClick={startNew}
                    className="inline-flex items-center gap-2 rounded-lg bg-orange-600 text-white px-4 py-2 text-sm hover:bg-orange-700"
                >
                    <span className="text-base leading-none">＋</span> New
                </button>
            </div>

            {/* Form */}
            {editing && (
                <form onSubmit={save} className="rounded-2xl border border-zinc-200 bg-white p-4 md:p-5">
                    <div className="grid gap-4 md:grid-cols-4">
                        {/* Media + Name (kolom 1-2) */}
                        <div className="md:col-span-2 space-y-4">
                            {/* Images */}
                            <div>
                                <div className="mb-2 flex items-center justify-between">
                                    <div className="font-medium">Image</div>
                                    <span className="text-xs text-zinc-500">Opsional</span>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {images.map((img, idx) => (
                                        <div key={idx} className="relative w-28 h-28 rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50">
                                            <img src={img.url} alt={name} className="w-full h-full object-cover" />
                                            <input
                                                placeholder="alt"
                                                value={img.alt || ''}
                                                onChange={e =>
                                                    setImages(prev => prev.map((x, i) => (i === idx ? { ...x, alt: e.target.value } : x)))
                                                }
                                                className="absolute left-1 right-1 bottom-1 rounded bg-white/85 px-1 text-[10px] border border-zinc-200"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(idx)}
                                                className="absolute top-1 right-1 text-xs bg-white/95 border border-zinc-200 px-1 rounded"
                                                title="Hapus"
                                            >
                                                ×
                                            </button>

                                        </div>
                                    ))}
                                    {images.length === 0 && (
                                        <label className="w-28 h-28 rounded-xl border border-dashed grid place-items-center text-xs cursor-pointer hover:bg-zinc-50">
                                            <input type="file" hidden accept="image/*" onChange={(e) => handleUpload(e.target.files?.[0])} />
                                            Upload
                                        </label>
                                    )}
                                </div>
                                {images.length > 1 && (
                                    <p className="mt-1 text-xs text-zinc-500">Gambar pertama dianggap sebagai cover.</p>
                                )}
                            </div>

                            {/* Name */}
                            <div>
                                <label className="text-sm">Name</label>
                                <input
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                                    required
                                    placeholder="Mis. Elektronik"
                                />
                            </div>
                        </div>

                        {/* Slug / Parent / Order (kolom 3-4) */}
                        <div className="space-y-4">
                            <label className="text-sm">Slug</label>
                            <div className="flex gap-2">
                                <input
                                    value={slug}
                                    onChange={e => {
                                        setSlug(e.target.value);
                                        setSlugTouched(true);
                                    }}
                                    onBlur={() => setSlug(s => toSlug(s))}
                                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                                    placeholder="elektronik"
                                />
                                <button
                                    type="button"
                                    onClick={() => { setSlug(toSlug(name)); setSlugTouched(true); }}
                                    className="mt-1 shrink-0 rounded-lg border px-3 py-2 text-sm hover:bg-zinc-50"
                                    title="Gunakan slug dari nama"
                                >
                                    Auto
                                </button>
                            </div>
                            <p className="text-xs text-zinc-500">Slug akan terlihat di URL.</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm">Parent</label>
                                <select
                                    value={parentId}
                                    onChange={e => setParentId(e.target.value)}
                                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                                >
                                    <option value="">(root)</option>
                                    {parents.map(p => (
                                        <option key={p._id} value={p._id}>
                                            {p.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-sm">Order</label>
                                <input
                                    type="number"
                                    value={order}
                                    onChange={e => setOrder(e.target.value)}
                                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                        <button
                            disabled={saving}
                            className="rounded-lg bg-orange-600 text-white px-4 py-2 disabled:opacity-60 hover:bg-orange-700"
                        >
                            {saving ? 'Saving…' : 'Save'}
                        </button>
                        <button
                            type="button"
                            onClick={cancelEdit}
                            className="rounded-lg border px-4 py-2 hover:bg-zinc-50"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            <div className="rounded-xl border bg-white p-3 flex items-center gap-2">
                <input
                    value={q} onChange={e => setQ(e.target.value)}
                    placeholder="Search name/slug..."
                    className="flex-1 rounded border px-3 py-2 text-sm"
                />
                <button onClick={() => load(1)} className="rounded border px-3 py-2 text-sm">Search</button>
            </div>

            {/* Table */}

            <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-zinc-50">
                            <tr className="text-zinc-700">
                                <th className="text-left px-4 py-2 font-medium">Name</th>
                                <th className="text-left px-4 py-2 font-medium">Slug</th>
                                <th className="text-left px-4 py-2 font-medium">Image</th>
                                <th className="text-left px-4 py-2 font-medium">Order</th>
                                <th className="text-left px-4 py-2 font-medium">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="border-t">
                                        <td className="px-4 py-3">
                                            <div className="h-4 w-44 bg-zinc-200 animate-pulse rounded" />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="h-4 w-28 bg-zinc-200 animate-pulse rounded" />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="h-12 w-12 bg-zinc-200 animate-pulse rounded" />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="h-4 w-10 bg-zinc-200 animate-pulse rounded" />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="h-8 w-28 bg-zinc-200 animate-pulse rounded" />
                                        </td>
                                    </tr>
                                ))
                            ) : tree.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                                        Belum ada kategori. Klik <b>New</b> untuk menambah.
                                    </td>
                                </tr>
                            ) : (
                                tree.map(c => {
                                    const img = Array.isArray(c.image) ? c.image[0] : c.image;
                                    return (
                                        <tr key={c._id} className="border-t">
                                            <td className="px-4 py-2">
                                                <span className="text-zinc-400">{'— '.repeat(c._depth || 0)}</span>
                                                <span className="font-medium">{c.name}</span>
                                                {c._depth === 0 && (
                                                    <span className="ml-2 text-[10px] rounded bg-zinc-100 px-1.5 py-0.5 text-zinc-600">
                                                        root
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2 text-zinc-600">{c.slug}</td>
                                            <td className="px-4 py-2">
                                                {(() => {
                                                    // Ambil URL dari berbagai kemungkinan bentuk
                                                    const url =
                                                        typeof c.image === 'string'
                                                            ? c.image
                                                            : Array.isArray(c.image)
                                                                ? (typeof c.image[0] === 'string' ? c.image[0] : c.image[0]?.url)
                                                                : c.image?.url;
                                                    return url
                                                        ? <img src={url} alt={c.name} className="h-12 w-12 rounded-lg object-cover border border-zinc-200" />
                                                        : <span className="text-zinc-400">—</span>;
                                                })()}
                                            </td>
                                            <td className="px-4 py-2">{c.order ?? 0}</td>
                                            <td className="px-4 py-2">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => startEdit(c)}
                                                        className="rounded-lg border px-3 py-1.5 hover:bg-zinc-50"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => remove(c)}
                                                        className="rounded-lg border border-red-200 text-red-600 px-3 py-1.5 hover:bg-red-50"
                                                    >
                                                        Hapus
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Pagination */}
            <div className="flex justify-end gap-2">
                <button
                    disabled={page <= 1}
                    onClick={() => router.replace(`/admin/categories?page=${page - 1}`)}
                    className="rounded border px-3 py-1 disabled:opacity-50"
                >
                    Prev
                </button>
                <button
                    disabled={page * limit >= total}
                    onClick={() => router.replace(`/admin/categories?page=${page + 1}`)}
                    className="rounded border px-3 py-1 disabled:opacity-50"
                >
                    Next
                </button>
            </div>

        </div>
    );
}
