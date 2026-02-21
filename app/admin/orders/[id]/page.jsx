'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fmtIDR } from '@/app/db/utils/format';
import { AdminOrders } from '../page';

const ORDER_STATUS = ['awaiting_payment','paid','processing','shipped','completed','cancelled','refunded'];
const PAYMENT_STATUS = ['pending','paid','failed','expired'];

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [o, setO] = useState(null);

  // form state
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [courier, setCourier] = useState('');
  const [service, setService] = useState('');
  const [trackingNo, setTrackingNo] = useState('');

  async function load() {
    setLoading(true);
    try {
      const { item } = await AdminOrders.get(id);
      setO(item);
      setStatus(item.status || '');
      setPaymentStatus(item.payment?.status || '');
      setCourier(item.shipment?.courier || '');
      setService(item.shipment?.service || '');
      setTrackingNo(item.shipment?.trackingNo || '');
    } catch (e) {
      alert(e.message || 'Gagal memuat');
      router.replace('/admin/orders');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  async function saveStatus() {
    try {
      const { item } = await AdminOrders.update(id, { status });
      setO(prev => ({ ...prev, status: item.status }));
      alert('Status order diperbarui');
    } catch (e) { alert(e.message); }
  }

  async function savePayment() {
    try {
      const { item } = await AdminOrders.update(id, { paymentStatus });
      setO(prev => ({ ...prev, payment: item.payment }));
      alert('Status pembayaran diperbarui');
    } catch (e) { alert(e.message); }
  }

  async function saveShipment() {
    try {
      const payload = { shipment: { courier, service, trackingNo } };
      const { item } = await AdminOrders.update(id, payload);
      setO(prev => ({ ...prev, shipment: item.shipment }));
      alert('Pengiriman diperbarui');
    } catch (e) { alert(e.message); }
  }

  if (loading || !o) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Order {o.orderNo}</h1>
        <div className="text-sm text-zinc-600">{o.placedAt ? new Date(o.placedAt).toLocaleString('id-ID') : '-'}</div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card title="Customer">
          <div className="text-sm">
            <div>{o.userId}</div>
            {/* kalau mau, pada admin list tadi sudah enrich email/name; bisa dipush juga ke detail */}
          </div>
        </Card>

        <Card title="Status">
          <div className="space-y-2 text-sm">
            <div>
              <div className="text-xs text-zinc-500">Order Status</div>
              <div className="flex gap-2">
                <select value={status} onChange={e=> setStatus(e.target.value)} className="rounded border px-2 py-1">
                  {ORDER_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={saveStatus} className="rounded bg-orange-600 text-white px-3">Simpan</button>
              </div>
            </div>

            <div>
              <div className="text-xs text-zinc-500">Payment Status</div>
              <div className="flex gap-2">
                <select value={paymentStatus} onChange={e=> setPaymentStatus(e.target.value)} className="rounded border px-2 py-1">
                  {PAYMENT_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={savePayment} className="rounded bg-orange-600 text-white px-3">Simpan</button>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Pengiriman">
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-zinc-500">Kurir</label>
              <input value={courier} onChange={e=> setCourier(e.target.value)} className="rounded border px-2 py-1" />
              <label className="text-xs text-zinc-500">Layanan</label>
              <input value={service} onChange={e=> setService(e.target.value)} className="rounded border px-2 py-1" />
              <label className="text-xs text-zinc-500">No. Resi</label>
              <input value={trackingNo} onChange={e=> setTrackingNo(e.target.value)} className="rounded border px-2 py-1" />
            </div>
            <button onClick={saveShipment} className="rounded bg-orange-600 text-white px-3 mt-2">Simpan Pengiriman</button>
          </div>
        </Card>
      </div>

      <Card title="Alamat Pengiriman">
        <Addr a={o.shippingAddress} />
      </Card>

      <Card title="Alamat Penagihan">
        <Addr a={o.billingAddress} />
      </Card>

      <Card title="Items">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="text-left px-3 py-2">SKU</th>
                <th className="text-left px-3 py-2">Produk</th>
                <th className="text-left px-3 py-2">Varian</th>
                <th className="text-right px-3 py-2">Qty</th>
                <th className="text-right px-3 py-2">Harga</th>
                <th className="text-right px-3 py-2">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {(o.items || []).map(it => (
                <tr key={it._id} className="border-t">
                  <td className="px-3 py-2">{it.sku}</td>
                  <td className="px-3 py-2">{it.title}</td>
                  <td className="px-3 py-2">{it.variantLabel || '-'}</td>
                  <td className="px-3 py-2 text-right">{it.qty}</td>
                  <td className="px-3 py-2 text-right">{fmtIDR(it.price?.unit)}</td>
                  <td className="px-3 py-2 text-right">{fmtIDR(it.price?.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Ringkasan Biaya">
        <div className="text-sm space-y-1">
          <Row label="Subtotal" value={fmtIDR(o.pricing?.subtotal)} />
          <Row label="Diskon" value={`- ${fmtIDR((o.pricing?.discounts || []).reduce((s,d)=> s + (d.amount||0), 0))}`} />
          <Row label="Ongkir" value={fmtIDR(o.pricing?.shippingCost)} />
          <Row label="Pajak" value={fmtIDR(o.pricing?.tax)} />
          <Row label="Grand Total" value={fmtIDR(o.pricing?.grandTotal)} bold />
        </div>
      </Card>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <section className="rounded-xl border bg-white p-4 space-y-3">
      <div className="font-medium">{title}</div>
      {children}
    </section>
  );
}

function Row({ label, value, bold }) {
  return (
    <div className={`flex items-center justify-between ${bold ? 'font-semibold' : ''}`}>
      <div>{label}</div><div>{value}</div>
    </div>
  );
}

function Addr({ a }) {
  if (!a) return <div className="text-sm text-zinc-500">-</div>;
  return (
    <div className="text-sm">
      <div className="font-medium">{a.receiverName}</div>
      <div>{a.phone}</div>
      <div>{a.street}</div>
      <div>{a.subdistrict}, {a.city}</div>
      <div>{a.province} {a.postalCode}</div>
      <div>{a.country}</div>
    </div>
  );
}
