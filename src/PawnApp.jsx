import React, { useEffect, useState } from 'react'

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function Currency({ value }) {
  const v = Number(value || 0)
  return <span>Rp{v.toLocaleString('id-ID')}</span>
}

function Field({ label, children }) {
  return (
    <label className="block mb-3">
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      {children}
    </label>
  )
}

function CreateTicket({ onCreated }) {
  const [form, setForm] = useState({
    name: '', phone: '', national_id: '', address: '',
    category: 'emas', description: '', estimated_value: '', weight_gram: '',
    principal: '', tenor_months: 4, monthly_interest_rate: 0.015,
  })
  const disabled = !form.name || !form.phone || !form.description || !form.principal

  const submit = async (e) => {
    e.preventDefault()
    const payload = {
      customer: {
        name: form.name,
        phone: form.phone,
        national_id: form.national_id || undefined,
        address: form.address || undefined,
      },
      item: {
        category: form.category,
        description: form.description,
        estimated_value: Number(form.estimated_value || form.principal),
        weight_gram: form.weight_gram ? Number(form.weight_gram) : undefined,
      },
      principal: Number(form.principal),
      tenor_months: Number(form.tenor_months),
      monthly_interest_rate: Number(form.monthly_interest_rate),
    }
    const res = await fetch(`${API}/tickets`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const data = await res.json()
    if (res.ok) {
      onCreated(data.ticket)
      setForm({ ...form, description: '', principal: '' })
    } else {
      alert(data.detail || 'Gagal membuat tiket')
    }
  }

  return (
    <form onSubmit={submit} className="bg-white rounded-xl shadow p-4 grid md:grid-cols-2 gap-4">
      <div>
        <h3 className="font-semibold mb-2">Data Nasabah</h3>
        <Field label="Nama">
          <input className="w-full border rounded px-3 py-2" value={form.name} onChange={e=>setForm(v=>({ ...v, name: e.target.value }))} required />
        </Field>
        <Field label="No. HP">
          <input className="w-full border rounded px-3 py-2" value={form.phone} onChange={e=>setForm(v=>({ ...v, phone: e.target.value }))} required />
        </Field>
        <Field label="No. KTP (opsional)">
          <input className="w-full border rounded px-3 py-2" value={form.national_id} onChange={e=>setForm(v=>({ ...v, national_id: e.target.value }))} />
        </Field>
        <Field label="Alamat (opsional)">
          <input className="w-full border rounded px-3 py-2" value={form.address} onChange={e=>setForm(v=>({ ...v, address: e.target.value }))} />
        </Field>
      </div>
      <div>
        <h3 className="font-semibold mb-2">Barang Gadai</h3>
        <Field label="Kategori">
          <select className="w-full border rounded px-3 py-2" value={form.category} onChange={e=>setForm(v=>({ ...v, category: e.target.value }))}>
            <option value="emas">Emas</option>
            <option value="gadget">Gadget</option>
            <option value="elektronik">Elektronik</option>
            <option value="kendaraan">Kendaraan</option>
            <option value="lainnya">Lainnya</option>
          </select>
        </Field>
        <Field label="Deskripsi">
          <input className="w-full border rounded px-3 py-2" value={form.description} onChange={e=>setForm(v=>({ ...v, description: e.target.value }))} required />
        </Field>
        <Field label="Nilai Taksiran (Rp)">
          <input type="number" className="w-full border rounded px-3 py-2" value={form.estimated_value} onChange={e=>setForm(v=>({ ...v, estimated_value: e.target.value }))} />
        </Field>
        <Field label="Berat (gram, opsional untuk emas)">
          <input type="number" className="w-full border rounded px-3 py-2" value={form.weight_gram} onChange={e=>setForm(v=>({ ...v, weight_gram: e.target.value }))} />
        </Field>
      </div>
      <div className="md:col-span-2 grid md:grid-cols-3 gap-4">
        <Field label="Pinjaman Pokok (Rp)">
          <input type="number" className="w-full border rounded px-3 py-2" value={form.principal} onChange={e=>setForm(v=>({ ...v, principal: e.target.value }))} required />
        </Field>
        <Field label="Tenor (bulan)">
          <input type="number" className="w-full border rounded px-3 py-2" value={form.tenor_months} onChange={e=>setForm(v=>({ ...v, tenor_months: e.target.value }))} />
        </Field>
        <Field label="Bunga per bulan">
          <input step="0.001" type="number" className="w-full border rounded px-3 py-2" value={form.monthly_interest_rate} onChange={e=>setForm(v=>({ ...v, monthly_interest_rate: e.target.value }))} />
        </Field>
      </div>
      <div className="md:col-span-2 flex justify-end gap-2">
        <button disabled={disabled} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded">Buat Tiket</button>
      </div>
    </form>
  )
}

function TicketRow({ t, onPay }) {
  const f = t.finance || { outstanding: 0, interest: 0, total_due: 0, paid: 0 }
  const [amt, setAmt] = useState('')
  return (
    <div className="p-4 rounded-lg border flex flex-col md:flex-row md:items-center gap-3">
      <div className="flex-1">
        <div className="font-semibold">{t.customer_name || 'Nasabah'} • {t.item_category}</div>
        <div className="text-sm text-gray-600">{t.item_desc}</div>
        <div className="text-sm text-gray-600">Mulai: {new Date(t.start_date).toLocaleDateString('id-ID')} • Jatuh Tempo: {new Date(t.due_date).toLocaleDateString('id-ID')}</div>
        <div className="text-sm">Pokok <Currency value={t.principal} /> • Bunga <Currency value={f.interest} /> • Terbayar <Currency value={f.paid} /> • Sisa <span className={f.outstanding>0? 'text-red-600 font-semibold':'text-green-600 font-semibold'}><Currency value={f.outstanding} /></span></div>
      </div>
      {t.status === 'active' && (
        <div className="flex items-center gap-2">
          <input type="number" placeholder="Nominal bayar" className="border rounded px-3 py-2 w-40" value={amt} onChange={e=>setAmt(e.target.value)} />
          <button onClick={()=>onPay(t._id, Number(amt||0), ()=>setAmt(''))} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded">Bayar</button>
        </div>
      )}
      {t.status !== 'active' && (
        <span className="px-2 py-1 text-xs rounded bg-gray-100">{t.status}</span>
      )}
    </div>
  )
}

export default function PawnApp() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchTickets = async () => {
    setLoading(true)
    const res = await fetch(`${API}/tickets`)
    const data = await res.json()
    setTickets(data.tickets || [])
    setLoading(false)
  }

  useEffect(() => { fetchTickets() }, [])

  const onCreated = () => fetchTickets()

  const onPay = async (ticket_id, amount, clear) => {
    if (!amount || amount <= 0) return alert('Masukkan nominal yang valid')
    const res = await fetch(`${API}/payments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticket_id, amount }) })
    const data = await res.json()
    if (!res.ok) return alert(data.detail || 'Gagal membayar')
    clear?.()
    fetchTickets()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-emerald-50">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-emerald-800">Pegadaian UMKM</h1>
            <p className="text-gray-600">Buat tiket gadai, kelola pembayaran, dan lacak status secara real-time.</p>
          </div>
          <button onClick={fetchTickets} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded">Refresh</button>
        </header>

        <CreateTicket onCreated={onCreated} />

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">Daftar Tiket</h2>
            {loading && <span className="text-sm text-gray-500">Memuat...</span>}
          </div>
          <div className="grid gap-3">
            {tickets.map(t => (
              <TicketRow key={t._id} t={t} onPay={onPay} />
            ))}
            {tickets.length === 0 && !loading && (
              <div className="p-6 border rounded-lg text-center text-gray-500">Belum ada tiket</div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
