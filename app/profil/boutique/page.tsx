'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Store, Globe, Package } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'

const PLATFORMS = [
  { id: 'youcan', name: 'Youcan', flag: '🇲🇦', desc: 'Recommandé Maroc' },
  { id: 'shopify', name: 'Shopify', flag: '🌍', desc: 'International' },
  { id: 'woocommerce', name: 'WooCommerce', flag: '⚙️', desc: 'Open source' },
  { id: 'autre', name: 'Autre', flag: '🔧', desc: 'Personnalisé' },
]

const MODELS = [
  { id: 'dropshipping', name: 'Dropshipping', icon: '🚚', desc: 'Sans stock, livraison fournisseur' },
  { id: 'revendeur', name: 'Revendeur', icon: '📦', desc: 'Stock personnel' },
  { id: 'marque_propre', name: 'Marque propre', icon: '🏷️', desc: 'Produits créés par toi' },
]

interface Shop {
  id: string
  name: string | null
  platform: string | null
  model: string | null
  url: string | null
  niche: string | null
}

export default function BoutiquePage() {
  const router = useRouter()
  const supabase = createClient()
  const { success, error: toastError } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [shop, setShop] = useState<Shop | null>(null)
  const [form, setForm] = useState({
    name: '',
    platform: '',
    model: '',
    url: '',
    niche: '',
  })

  useEffect(() => {
    loadShop()
  }, [])

  const loadShop = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('shops')
      .select('id, name, platform, model, url, niche')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (data) {
      setShop(data)
      setForm({
        name: data.name || '',
        platform: data.platform || '',
        model: data.model || '',
        url: data.url || '',
        niche: data.niche || '',
      })
    }
    setLoading(false)
  }

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setSaving(true)
    const payload = { ...form, updated_at: new Date().toISOString() }

    let error
    if (shop) {
      const res = await supabase.from('shops').update(payload).eq('id', shop.id)
      error = res.error
    } else {
      const res = await supabase.from('shops').insert({ ...payload, user_id: user.id })
      error = res.error
    }

    if (error) toastError('Erreur lors de la sauvegarde')
    else success('Boutique mise à jour !')
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-navy px-5 py-5 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-blue-200 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
          <Store className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-white font-black">Ma boutique</h1>
          <p className="text-blue-200 text-xs">Paramètres de ta boutique</p>
        </div>
      </div>

      <div className="flex-1 px-4 py-5 space-y-5">
        {/* Nom boutique */}
        <div className="card space-y-3">
          <h2 className="font-bold text-navy flex items-center gap-2">
            <Store className="w-4 h-4 text-accent" /> Informations générales
          </h2>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              Nom de ta boutique
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Ma boutique marocaine"
              className="input"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              Niche principale
            </label>
            <input
              type="text"
              value={form.niche}
              onChange={e => setForm(p => ({ ...p, niche: e.target.value }))}
              placeholder="Ex: Cosmétiques naturels, Mode femme..."
              className="input"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              URL de ta boutique <span className="text-gray-400 normal-case font-normal">(optionnel)</span>
            </label>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                type="url"
                value={form.url}
                onChange={e => setForm(p => ({ ...p, url: e.target.value }))}
                placeholder="https://maboutique.youcan.shop"
                className="input flex-1"
              />
            </div>
          </div>
        </div>

        {/* Plateforme */}
        <div className="card space-y-3">
          <h2 className="font-bold text-navy flex items-center gap-2">
            <Package className="w-4 h-4 text-accent" /> Plateforme
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {PLATFORMS.map(p => (
              <button
                key={p.id}
                onClick={() => setForm(prev => ({ ...prev, platform: p.id }))}
                className={cn(
                  'p-3 rounded-xl border-2 text-left transition-all',
                  form.platform === p.id
                    ? 'border-accent bg-orange-50'
                    : 'border-gray-100 hover:border-gray-200'
                )}
              >
                <div className="text-xl mb-1">{p.flag}</div>
                <div className="font-bold text-navy text-sm">{p.name}</div>
                <div className="text-xs text-gray-400">{p.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Modèle */}
        <div className="card space-y-3">
          <h2 className="font-bold text-navy">Modèle de vente</h2>
          <div className="space-y-2">
            {MODELS.map(m => (
              <button
                key={m.id}
                onClick={() => setForm(prev => ({ ...prev, model: m.id }))}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all',
                  form.model === m.id
                    ? 'border-accent bg-orange-50'
                    : 'border-gray-100 hover:border-gray-200'
                )}
              >
                <span className="text-2xl">{m.icon}</span>
                <div>
                  <div className="font-bold text-navy text-sm">{m.name}</div>
                  <div className="text-xs text-gray-400">{m.desc}</div>
                </div>
                {form.model === m.id && (
                  <div className="ml-auto w-5 h-5 bg-accent rounded-full flex items-center justify-center text-white text-xs font-bold">
                    ✓
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className={cn('btn-primary', saving && 'opacity-60')}
        >
          {saving ? 'Sauvegarde...' : 'Enregistrer les modifications'}
        </button>
      </div>
    </div>
  )
}
