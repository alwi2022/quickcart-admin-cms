'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, ok } from '@/app/db/utils/api';

const ALL_ROLES = ['customer', 'seller', 'admin'];

export default function AdminUserFormPage() {
    const { id } = useParams(); // "new" atau ObjectId
    const router = useRouter();

    const isNew = id === 'new';
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [roles, setRoles] = useState(['customer']);
    const [status, setStatus] = useState('active');
    const [password, setPassword] = useState('');
    useEffect(() => {
        if (isNew) return;
        (async () => {
            try {
                const { item } = await ok(api.get(`/api/admin/users/${id}`));
                setName(item.name || '');
                setEmail(item.email || '');
                setPhone(item.phone || '');
                setRoles(item.roles || ['customer']);
                setStatus(item.status || 'active');
                setPassword(item.password || '');
            } catch (e) {
                alert(e.message); router.replace('/admin/users');
            } finally { setLoading(false); }
        })();
    }, [id, isNew, router]);

    async function save(e) {
        e.preventDefault();
        setSaving(true);
        try {
            if (isNew) {
                await ok(api.post('/api/admin/users', { name, email, phone, roles, status, password }));
            } else {
                await ok(api.patch(`/api/admin/users/${id}`, { name, email, phone, roles, status, password }));
            }
            router.replace('/admin/users');
            router.refresh();
        } catch (e) { alert(e.message); } finally { setSaving(false); }
    }

    console.log(password, 'ini password di layer admin')

    if (loading) return null;

    return (
        <div className="p-6 max-w-xl">
            <h1 className="text-xl font-semibold mb-4">{isNew ? 'New User' : 'Edit User'}</h1>
            <form onSubmit={save} className="space-y-4 rounded-xl border bg-white p-4">
                <div>
                    <label className="text-sm">Name</label>
                    <input value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" required />
                </div>
                <div>
                    <label className="text-sm">Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" required />
                </div>
                <div>
                    <label className="text-sm">Phone</label>
                    <input value={phone} onChange={e => setPhone(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" />
                </div>

                <div>
                    <label className="text-sm">Password</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" />
                </div>

                <div>
                    <label className="text-sm">Roles</label>
                    <div className="flex gap-3 mt-1">
                        {ALL_ROLES.map(r => (
                            <label key={r} className="text-sm">
                                <input type="checkbox" checked={roles.includes(r)} onChange={(e) => {
                                    setRoles(prev => e.target.checked ? [...new Set([...prev, r])] : prev.filter(x => x !== r));
                                }} /> <span className="ml-1">{r}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="text-sm">Status</label>
                    <select value={status} onChange={e => setStatus(e.target.value)} className="mt-1 w-full rounded border px-3 py-2">
                        <option value="active">active</option>
                        <option value="blocked">blocked</option>
                        <option value="deleted">deleted</option>
                    </select>
                </div>

                <div className="flex gap-2">
                    <button disabled={saving} className="rounded bg-orange-600 text-white px-4 py-2">{saving ? 'Saving…' : 'Save'}</button>
                    <button type="button" onClick={() => router.back()} className="rounded border px-4 py-2">Cancel</button>
                </div>
            </form>
        </div>
    );
}
