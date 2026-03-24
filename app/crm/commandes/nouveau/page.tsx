'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Search, ShoppingBag } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'
import { Suspense } from 'react'

type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered'

const STATUS_OPTIONS: { id: OrderStatus; label: string; icon: string }[] = [
  { id: 'pending',   label: 'En attente',  icon: '⏳' },
  { id: 'confirmed', label: 'Confirmée',   icon: '✅' },
  { id: 'shipped',   label: 'Expédiée',    icon: '🚚' },
  { id: 'delivered', label: 'Livrée',      icon: '✓' },
]

const PAYMENT_METHODS = ['COD', 'Virement', 'CIH Pay', 'Cash Plus', 'Autre']

const DELIVERY_COMPANIES = ['Amana Express', 'Chronopost Maroc', 'Aramex', 'CTM Messagerie', 'Autre']

interface ClientOption {
  id: string
  name: string
  phone: string | null
  city: string | null
}

function NouvelleCommandeForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const { success, error: toastError } = useToast()

  const preselectedClientId = searchParams.get('client')

  const [saving, setSaving] = useState(false)
  const [clients, setClients] = useState<ClientOption[]>([])
  const [clientSearch, setClientSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState<ClientOption | null>(null)
  const [showClientList, setShowClientList] = useState(false)

  const [form, setForm] = useState({
    product_name: '',
    amount: '',
    status: 'pending' as OrderStatus,
    payment_method: 'COD',
    delivery_company: 'Amana Express',
    tracking_number: '',
    notes: '',
    city: '',
  })

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('clients')
      .select('id, name, phone, city')
      .eq('user_id', user.id)
      .order('name')

    const list = data || []
    setClients(list)

    if (preselectedClientId) {
      const found = list.find(c => c.id === preselectedClientId)
      if (found) {
        setSelectedClient(found)
        setClientSearch(found.name)
        setForm(p => ({ ...p, city: found.city || '' }))
      }
    }
  }

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    (c.phone && c.phone.includes(clientSearch))
  )

  const set = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const selectClient = (c: ClientOption) => {
    setSelectedClient(c)
    setClientSearch(c.name)
    setForm(p => ({ ...p, city: c.city || '' }))
    setShowClientList(false)
  }

  const generateReference = () =>
    `CMD-${Date.now().toString().slice(-6)}`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.product_name.trim()) { toastError('Nom du produit obligatoire'); return }
    if (!form.amount || isNaN(Number(form.amount))) { toastError('Montant invalide'); return }

    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const reference = generateReference()

    const { error } = await supabase.from('orders').insert({
      user_id: user.id,
      client_id: selectedClient?.id || null,
      reference,
      product_name: form.product_name.trim(),
      amount: Number(form.amount),
      status: form.status,
      payment_method: form.payment_method,
      delivery_company: form.delivery_company || null,
      tracking_number: form.tracking_number.trim() || null,
      city: form.city || selectedClient?.city || null,
      notes: form.notes.trim() || null,
      created_at: new Date().toISOString(),
    })

    // Update client totals if linked
    if (!error && selectedClient) {
      await supabase.rpc('increment_client_orders', {
        client_id: selectedClient.id,
        amount: Number(form.amount),
      }).catch(() => {
        // Fallback: manual update
        supabase
          .from('clients')
          .select('total_orders, total_spent')
          .eq('id', selectedClient.id)
          .single()
          .then(({ data }) => {
            if (data) {
              supabase.from('clients').update({
                total_orders: (data.total_orders || 0) + 1,
                total_spent: (data.total_spent || 0) + Number(form.amount),
                last_order_at: new Date().toISOString(),
              }).eq('id', selectedClient.id)
            }
          })
      })
    }

    setSaving(false)

    if (error) {
      toastError('Erreur lors de la création. Réessaie.')
    } else {
      success(`Commande ${reference} créée !`)
      router.push(selectedClient ? `/crm/${selectedClient.id}` : '/crm/commandes')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-navy px-5 py-5 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-blue-200 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
          <ShoppingBag className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-white font-black">Nouvelle commande</h1>
          <p className="text-blue-200 text-xs">Saisie manuelle</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 px-4 py-5 space-y-4">

        {/* Client */}
        <div className="card space-y-3">
          <h2 className="font-bold text-navy text-sm">👤 Client</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={clientSearch}
              onChange={e => { setClientSearch(e.target.value); setShowClientList(true); setSelectedClient(null) }}
              onFocus={() => setShowClientList(true)}
              placeholder="Rechercher un client existant..."
              className="input pl-9"
            />
            {showClientList && clientSearch.length > 0 && filteredClients.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-xl border border-gray-100 shadow-lg z-20 max-h-48 overflow-y-auto">
                {filteredClients.slice(0, 8).map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectClient(c)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
                  >
                    <div className="w-8 h-8 bg-navy rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-navy text-sm">{c.name}</div>
                      {c.phone && <div className="text-xs text-gray-400">{c.phone}</div>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          {selectedClient && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
              <span className="text-green-600 text-sm">✓</span>
              <span className="text-green-700 text-sm font-semibold">{selectedClient.name}</span>
              {selectedClient.city && <span className="text-green-500 text-xs">— {selectedClient.city}</span>}
              <button type="button" onClick={() => { setSelectedClient(null); setClientSearch('') }} className="ml-auto text-green-500 hover:text-red-400 text-xs">✕</button>
            </div>
          )}
          {!selectedClient && (
            <p className="text-xs text-gray-400">
              Pas encore de client ?{' '}
              <button
                type="button"
                onClick={() => router.push('/crm/nouveau')}
                className="text-accent font-bold hover:underline"
              >
                Créer un client
              </button>
            </p>
          )}
        </div>

        {/* Produit + montant */}
        <div className="card space-y-3">
          <h2 className="font-bold text-navy text-sm">📦 Commande</h2>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              Produit commandé <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.product_name}
              onChange={e => set('product_name', e.target.value)}
              placeholder="Ex: Crème argan naturelle 50ml"
              required
              className="input"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Montant (MAD) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={form.amount}
                onChange={e => set('amount', e.target.value)}
                placeholder="189"
                min="0"
                step="1"
                required
                className="input"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Ville livraison
              </label>
              <input
                type="text"
                value={form.city}
                onChange={e => set('city', e.target.value)}
                placeholder="Casablanca"
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Statut */}
        <div className="card space-y-3">
          <h2 className="font-bold text-navy text-sm">📊 Statut</h2>
          <div className="grid grid-cols-2 gap-2">
            {STATUS_OPTIONS.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => set('status', s.id)}
                className={cn(
                  'flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all',
                  form.status === s.id
                    ? 'border-accent bg-orange-50'
                    : 'border-gray-100 hover:border-gray-200'
                )}
              >
                <span className="text-lg">{s.icon}</span>
                <span className={cn('text-sm font-semibold', form.status === s.id ? 'text-accent' : 'text-navy')}>
                  {s.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Livraison */}
        <div className="card space-y-3">
          <h2 className="font-bold text-navy text-sm">🚚 Livraison &amp; Paiement</h2>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              Mode de paiement
            </label>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => set('payment_method', m)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all',
                    form.payment_method === m
                      ? 'border-accent bg-orange-50 text-accent'
                      : 'border-gray-200 text-gray-500'
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              Transporteur
            </label>
            <div className="flex flex-wrap gap-2">
              {DELIVERY_COMPANIES.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set('delivery_company', c)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all',
                    form.delivery_company === c
                      ? 'border-navy bg-navy/5 text-navy'
                      : 'border-gray-200 text-gray-500'
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              Numéro de suivi <span className="text-gray-400 font-normal normal-case">(optionnel)</span>
            </label>
            <input
              type="text"
              value={form.tracking_number}
              onChange={e => set('tracking_number', e.target.value)}
              placeholder="Ex: AM123456789MA"
              className="input"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="card space-y-2">
          <label className="font-bold text-navy text-sm">
            Notes <span className="text-gray-400 font-normal text-xs">(optionnel)</span>
          </label>
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="Instructions spéciales, couleur, taille, remarques..."
            rows={2}
            className="w-full text-sm text-gray-700 resize-none focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className={cn('btn-primary', saving && 'opacity-60')}
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
              Enregistrement...
            </span>
          ) : '+ Créer la commande'}
        </button>
      </form>
    </div>
  )
}

export default function NouvelleCommandePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <NouvelleCommandeForm />
    </Suspense>
  )
}
