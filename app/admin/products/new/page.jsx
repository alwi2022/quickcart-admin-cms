// app/admin/products/new/page.jsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

function toSlug(s = '') {
    return s.toLowerCase().trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

export default function AdminProductNewPage() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [brands, setBrands] = useState([]);
    const [categories, setCategories] = useState([]);
    const [inventory, setInventory] = useState([]);
    // form state
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [brandId, setBrandId] = useState('');
    const [categoryIds, setCategoryIds] = useState([]); // multi
    const [subtitle, setSubtitle] = useState('');
    const [descriptionHtml, setDescriptionHtml] = useState('');
    const [media, setMedia] = useState([]); // [{url, alt, publicId?}]
    const [seo, setSeo] = useState({ title: '', metaDescription: '' });
    const [status, setStatus] = useState('active');

    const [variants, setVariants] = useState([
        { sku: '', options: {}, price: { currency: 'IDR', list: 0, sale: null }, weightGram: null, dimensionsCm: { l: null, w: null, h: null }, barcode: '', status: 'active' }
    ]);

    // load brand & category
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const [bRes, cRes] = await Promise.all([
                    fetch('/api/admin/brands', { credentials: 'include', cache: 'no-store' }),
                    fetch('/api/admin/categories', { credentials: 'include', cache: 'no-store' }),
                ]);
                const [b, c] = await Promise.all([bRes.json(), cRes.json()]);
                if (!mounted) return;
                setBrands(b.items || []);
                setCategories(c.items || []);
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, []);

    // auto-slug
    useEffect(() => {
        if (!slug && title) setSlug(toSlug(title));
        // eslint-disable-next-line
    }, [title]);

    function setVariant(idx, patch) {
        setVariants(vs => vs.map((v, i) => (i === idx ? { ...v, ...patch } : v)));
    }
    function addVariant() {
        setVariants(vs => [...vs, { sku: '', options: {}, price: { currency: 'IDR', list: 0, sale: null }, weightGram: null, dimensionsCm: { l: null, w: null, h: null }, barcode: '', status: 'active' }]);
    }
    function removeVariant(i) {
        setVariants(vs => vs.filter((_, idx) => idx !== i));
    }

    async function handleUpload(file) {
        if (!file) return;
        try {
            const sigRes = await fetch('/api/admin/uploads/cloudinary-sign', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    folder: 'galatech/products',
                    public_id: `prod-${toSlug(title || 'untitled')}-${Date.now()}`
                }),
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

            setMedia(prev => [...prev, { url: uj.secure_url || uj.url, alt: '', publicId: uj.public_id }]);
        } catch (e) {
            alert(e.message || 'Upload gagal');
        }
    }

    function removeImage(i) {
        setMedia(prev => prev.filter((_, idx) => idx !== i));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                title,
                slug,
                subtitle,
                brandId: brandId || null,
                categoryIds,
                descriptionHtml,
                media: media.map(m => ({ url: m.url, alt: m.alt || '' })), // simpan url+alt saja (schema kamu)
                attributes: {}, // opsional
                variants: variants.map(v => ({
                    sku: v.sku,
                    options: v.options || {},
                    price: {
                        currency: v.price?.currency || 'IDR',
                        list: Number(v.price?.list) || 0,
                        sale: v.price?.sale == null || v.price?.sale === '' ? null : Number(v.price?.sale),
                        startAt: v.price?.startAt || null,
                        endAt: v.price?.endAt || null,
                    },
                    weightGram: v.weightGram == null || v.weightGram === '' ? null : Number(v.weightGram),
                    dimensionsCm: {
                        l: v.dimensionsCm?.l ? Number(v.dimensionsCm.l) : null,
                        w: v.dimensionsCm?.w ? Number(v.dimensionsCm.w) : null,
                        h: v.dimensionsCm?.h ? Number(v.dimensionsCm.h) : null,
                    },
                    barcode: v.barcode || '',
                    status: v.status || 'active',
                })),
                seo,
                status,
                inventory
            };

            const res = await fetch('/api/admin/products', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const j = await res.json();
            if (!res.ok) {
                alert(j?.error || 'Gagal membuat produk');
                return;
            }
            alert('Produk dibuat');
            router.replace('/admin/products');
            router.refresh();
        } finally {
            setSaving(false);
        }
    }

    if (loading) return null;

    return (
        <div className="max-w-4xl space-y-6">
            <h1 className="text-xl font-semibold">New Product</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Media */}
                <section className="rounded-xl border bg-white p-4">
                    <div className="font-medium mb-2">Images</div>
                    <div className="flex flex-wrap gap-3">
                        {media.map((m, i) => (
                            <div key={i} className="relative w-28 h-28 rounded-lg overflow-hidden border">
                                <img src={m.url} alt={m.alt || ''} className="w-full h-full object-cover" />
                                {i === 0 && (
                                    <span className="absolute left-1 top-1 text-[10px] bg-orange-600 text-white px-1 rounded">Cover</span>
                                )}
                                <input
                                    placeholder="alt"
                                    value={m.alt || ''}
                                    onChange={e => setMedia(prev => prev.map((x, idx) => idx === i ? { ...x, alt: e.target.value } : x))}
                                    className="absolute left-1 right-1 bottom-1 rounded bg-white/80 px-1 text-[10px] border"
                                />
                                <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 text-xs bg-white/90 border px-1 rounded">x</button>

                            </div>

                        ))}
                        <label className="w-28 h-28 rounded-lg border border-dashed grid place-items-center text-xs cursor-pointer">
                            <input type="file" hidden accept="image/*" onChange={(e) => handleUpload(e.target.files?.[0])} />
                            + Upload
                        </label>
                    </div>
                </section>

                {/* Basic */}
                <section className="rounded-xl border bg-white p-4 grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm text-zinc-600">Title</label>
                        <input value={title} onChange={e => setTitle(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" required />
                    </div>
                    <div>
                        <label className="text-sm text-zinc-600">Slug</label>
                        <input value={slug} onChange={e => setSlug(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" />
                    </div>
                    <div>
                        <label className="text-sm text-zinc-600">Brand</label>
                        <select value={brandId} onChange={e => setBrandId(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" required>
                            <option value="">Pilih brand</option>
                            {brands.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm text-zinc-600">Categories</label>
                        <select multiple value={categoryIds} onChange={e => setCategoryIds(Array.from(e.target.selectedOptions).map(o => o.value))} className="mt-1 w-full rounded border px-3 py-2 min-h-[42px]" required>
                            {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                        <div className="text-[11px] text-zinc-500 mt-1">Tekan Ctrl/Cmd untuk memilih banyak</div>
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-sm text-zinc-600">Subtitle (opsional)</label>
                        <input value={subtitle} onChange={e => setSubtitle(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" />
                    </div>
                </section>

                {/* Description */}
                <section className="rounded-xl border bg-white p-4">
                    <label className="text-sm text-zinc-600">Description (HTML/teks)</label>
                    <textarea rows={6} value={descriptionHtml} onChange={e => setDescriptionHtml(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" />
                </section>

                {/* Variants */}
                <section className="rounded-xl border bg-white p-4">
                    <div className="flex items-center justify-between">
                        <div className="font-medium">Variants</div>
                        <button type="button" onClick={addVariant} className="text-sm rounded border px-2 py-1">+ Add Variant</button>
                    </div>
                    <div className="mt-3 space-y-4">
                        {variants.map((v, i) => (
                            <div key={i} className="rounded-lg border p-3 grid md:grid-cols-3 gap-3">
                                <div>
                                    <label className="text-xs text-zinc-600">SKU</label>
                                    <input value={v.sku} onChange={e => setVariant(i, { sku: e.target.value })} className="mt-1 w-full rounded border px-3 py-2" required />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-600">List Price (Rp)</label>
                                    <input type="number" value={v.price?.list ?? ''} onChange={e => setVariant(i, { price: { ...v.price, list: e.target.value } })} className="mt-1 w-full rounded border px-3 py-2" required />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-600">Sale Price (Rp)</label>
                                    <input type="number" value={v.price?.sale ?? ''} onChange={e => setVariant(i, { price: { ...v.price, sale: e.target.value } })} className="mt-1 w-full rounded border px-3 py-2" />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-600">Weight (gram)</label>
                                    <input type="number" value={v.weightGram ?? ''} onChange={e => setVariant(i, { weightGram: e.target.value })} className="mt-1 w-full rounded border px-3 py-2" />
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <label className="text-xs text-zinc-600">L (cm)</label>
                                        <input type="number" value={v.dimensionsCm?.l ?? ''} onChange={e => setVariant(i, { dimensionsCm: { ...v.dimensionsCm, l: e.target.value } })} className="mt-1 w-full rounded border px-3 py-2" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-zinc-600">W (cm)</label>
                                        <input type="number" value={v.dimensionsCm?.w ?? ''} onChange={e => setVariant(i, { dimensionsCm: { ...v.dimensionsCm, w: e.target.value } })} className="mt-1 w-full rounded border px-3 py-2" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-zinc-600">H (cm)</label>
                                        <input type="number" value={v.dimensionsCm?.h ?? ''} onChange={e => setVariant(i, { dimensionsCm: { ...v.dimensionsCm, h: e.target.value } })} className="mt-1 w-full rounded border px-3 py-2" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-600">Barcode</label>
                                    <input value={v.barcode || ''} onChange={e => setVariant(i, { barcode: e.target.value })} className="mt-1 w-full rounded border px-3 py-2" />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-600">Status</label>
                                    <select value={v.status} onChange={e => setVariant(i, { status: e.target.value })} className="mt-1 w-full rounded border px-3 py-2">
                                        <option value="active">active</option>
                                        <option value="inactive">inactive</option>
                                    </select>
                                </div>
                                <div className="md:col-span-3 flex items-center justify-between">
                                    <OptionsEditor value={v.options} onChange={(opt) => setVariant(i, { options: opt })} />
                                    <button type="button" onClick={() => removeVariant(i)} className="text-xs rounded border px-2 py-1">Remove</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* SEO & Status */}
                <section className="rounded-xl border bg-white p-4 grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm text-zinc-600">SEO Title</label>
                        <input value={seo.title} onChange={e => setSeo(s => ({ ...s, title: e.target.value }))} className="mt-1 w-full rounded border px-3 py-2" />
                    </div>
                    <div>
                        <label className="text-sm text-zinc-600">SEO Description</label>
                        <input value={seo.metaDescription} onChange={e => setSeo(s => ({ ...s, metaDescription: e.target.value }))} className="mt-1 w-full rounded border px-3 py-2" />
                    </div>
                    <div>
                        <label className="text-sm text-zinc-600">Status</label>
                        <select value={status} onChange={e => setStatus(e.target.value)} className="mt-1 w-full rounded border px-3 py-2">
                            <option value="active">active</option>
                            <option value="draft">draft</option>
                            <option value="archived">archived</option>
                        </select>
                    </div>
                </section>

                <section className="rounded-xl border bg-white p-4">
                    <div className="font-medium mb-2">Initial Inventory (opsional)</div>
                    <div className="space-y-2">
                        {variants.map((v, i) => (
                            <div key={i} className="grid grid-cols-3 gap-2">
                                <input value={v.sku} readOnly className="rounded border px-3 py-2 bg-zinc-50" />
                                <input
                                    type="number"
                                    placeholder="Qty"
                                    onChange={e => {
                                        const qty = Number(e.target.value) || 0;
                                        setInventory(prev => {
                                            const idx = prev.findIndex(x => x.sku === v.sku);
                                            if (idx >= 0) {
                                                const next = [...prev]; next[idx] = { ...next[idx], qty }; return next;
                                            }
                                            return [...prev, { sku: v.sku, qty, warehouse: 'main' }];
                                        });
                                    }}
                                    className="rounded border px-3 py-2"
                                />
                                <input
                                    placeholder="Warehouse (default: main)"
                                    onChange={e => {
                                        const warehouse = e.target.value || 'main';
                                        setInventory(prev => {
                                            const idx = prev.findIndex(x => x.sku === v.sku);
                                            if (idx >= 0) {
                                                const next = [...prev]; next[idx] = { ...next[idx], warehouse }; return next;
                                            }
                                            return [...prev, { sku: v.sku, qty: 0, warehouse }];
                                        });
                                    }}
                                    className="rounded border px-3 py-2"
                                />
                            </div>
                        ))}
                    </div>
                </section>

                <div className="flex gap-2">
                    <button disabled={saving} className="rounded bg-orange-600 text-white px-4 py-2">{saving ? 'Saving...' : 'Create'}</button>
                    <button type="button" onClick={() => router.back()} className="rounded border px-4 py-2">Cancel</button>
                </div>
            </form>
        </div>
    );
}

function OptionsEditor({ value, onChange }) {
    const [k, setK] = useState('');
    const [v, setV] = useState('');
    const entries = useMemo(() => Object.entries(value || {}), [value]);

    function setKV(key, val) {
        const next = { ...(value || {}) };
        if (val === undefined || val === '') delete next[key];
        else next[key] = val;
        onChange(next);
    }

    return (
        <div className="text-sm w-full">
            <div className="font-medium mb-1">Options (contoh: color, size)</div>
            <div className="grid grid-cols-3 gap-2">
                <input value={k} onChange={e => setK(e.target.value)} placeholder="Key" className="rounded border px-2 py-1" />
                <input value={v} onChange={e => setV(e.target.value)} placeholder="Value" className="rounded border px-2 py-1" />
                <button type="button" onClick={() => { if (!k) return; setKV(k, v); setK(''); setV(''); }} className="rounded border px-2 py-1">Add/Update</button>
            </div>
            <ul className="mt-2 divide-y">
                {entries.map(([kk, vv]) => (
                    <li key={kk} className="py-1 flex items-center justify-between">
                        <div><span className="font-medium">{kk}</span>: {String(vv)}</div>
                        <button type="button" onClick={() => setKV(kk, undefined)} className="text-xs rounded border px-2 py-1">Remove</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
