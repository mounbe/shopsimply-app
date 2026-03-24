'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Package, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'

const CATEGORIES = ['Beauté & Soins', 'Mode & Vêtements', 'Maison & Déco', 'Sport & Fitness', 'Électronique', 'Alimentation', 'Bébé & Enfants', 'Autre']

export default function NouveauProduitPage() {
  const router = useRouter()
  const supabase = createClient()
  const { success, error: toastError, loading: toastLoading, dismiss } = useToast()

  const [saving, setSaving] = useState(false)
  const [generatingAI, setGeneratingAI] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    buying_price: '',
    selling_price: '',
    stock: '',
    category: '',
    supplier_url: '',
    status: 'active' as 'active' | 'draft',
  })

  const set = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const margin = () => {
    const bp = parseFloat(form.buying_price) || 0
    const sp = parseFloat(form.selling_price) || 0
    if (sp <= 0) return null
    return Math.round(((sp - bp) / sp) * 100)
  }

  const generateDescription = async () => {
    if (!form.name.trim()) { toastError('Saisis d\'abord le nom du produit'); return }
    setGeneratingAI(true)
    const id = toastLoading('Génération de la description...')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Génère une description produit courte et percutante (max 120 mots) pour "${form.name}" à vendre sur une boutique e-commerce marocaine. ${form.category ? `Catégorie: ${form.category}.` : ''} La description doit être en français, mettre en avant les bénéfices (pas les caractéristiques), rassurer sur la qualité, et inciter à l'achat en COD. Réponds UNIQUEMENT avec la description, sans titre ni en-tête.`,
          }],
          context: { userName: 'ShopSimply', niche: 'e-commerce', platform: 'Youcan' },
        }),
      })

      if (!response.body) throw new Error('No body')
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let content = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const parsed = JSON.parse(line.slice(6))
              if (parsed.text) content += parsed.text
            } catch {}
          }
        }
      }

      set('description', content.trim())
      dismiss(id)
      success('Description générée !')
    } catch {
      dismiss(id)
      toastError('Erreur lors de la génération')
    } finally {
      setGeneratingAI(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { toastError('Nom obligatoire'); return }
    if (!form.selling_price) { toastError('Prix de vente obligatoire'); return }

    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('products').insert({
      user_id: user.id,
      name: form.name.trim(),
      description: form.description.trim() || null,
      buying_price: parseFloat(form.buying_price) || 0,
      selling_price: parseFloat(form.selling_price),
      stock: form.stock ? parseInt(form.stock) : null,
      category: form.category || null,
      supplier_url: form.supplier_url.trim() || null,
      status: form.status,
      created_at: new Date().toISOString(),
    })

    setSaving(false)

    if (error) {
      toastError('Erreur lors de la création')
    } else {
      success('Produit créé avec succès !')
      router.push('/produits')
    }
  }

  const m = margin()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-2xl mx-auto">
      <div className="bg-navy px-5 py-5 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-blue-200 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
          <Package className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-white font-black">Nouveau produit</h1>
          <p className="text-blue-200 text-xs">Description IA incluse</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 px-4 py-5 space-y-4">
        {/* Infos de base */}
        <div className="card space-y-4">
          <h2 className="font-bold text-navy text-sm">📦 Informations produit</h2>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              Nom du produit <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Ex: Crème argan naturelle 50ml"
              required
              autoFocus
              className="input"
            />
          </div>

          {/* Description + bouton IA */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Description
              </label>
              <button
                type="button"
                onClick={generateDescription}
                disabled={generatingAI || !form.name.trim()}
                className={cn(
                  'flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all',
                  generatingAI ? 'bg-gray-100 text-gray-400' :
                  form.name.trim() ? 'bg-teal-brand/10 text-teal-brand hover:bg-teal-brand/20' :
                  'bg-gray-100 text-gray-300 cursor-not-allowed'
                )}
              >
                {generatingAI ? (
                  <><span className="w-3 h-3 border-2 border-teal-brand/50 border-t-teal-brand rounded-full animate-spin" /> Génération...</>
                ) : (
                  <><Sparkles className="w-3 h-3" /> Générer avec IA</>
                )}
              </button>
            </div>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Description du produit, avantages, utilisation..."
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 resize-none focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          {/* Catégorie */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              Catégorie
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => set('category', form.category === cat ? '' : cat)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all',
                    form.category === cat
                      ? 'border-accent bg-orange-50 text-accent'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Prix */}
        <div className="card space-y-4">
          <h2 className="font-bold text-navy text-sm">💰 Prix &amp; Marge</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Prix fournisseur
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={form.buying_price}
                  onChange={e => set('buying_price', e.target.value)}
                  placeholder="60"
                  min="0"
                  className="input pr-14"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">MAD</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Prix de vente <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={form.selling_price}
                  onChange={e => set('selling_price', e.target.value)}
                  placeholder="199"
                  min="0"
                  required
                  className="input pr-14"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">MAD</span>
              </div>
            </div>
          </div>

          {/* Marge live */}
          {m !== null && (
            <div className={cn(
              'flex items-center justify-between rounded-xl px-4 py-3 border-2',
              m >= 30 ? 'bg-green-50 border-green-200' :
              m >= 15 ? 'bg-blue-50 border-blue-200' :
              'bg-amber-50 border-amber-200'
            )}>
              <span className="text-sm font-semibold text-gray-600">Marge brute</span>
              <span className={cn(
                'font-black text-lg',
                m >= 30 ? 'text-green-700' : m >= 15 ? 'text-blue-700' : 'text-amber-700'
              )}>
                {m}%
                {m >= 30 ? ' 🚀' : m >= 15 ? ' ✅' : ' ⚠️'}
              </span>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              Stock <span className="text-gray-400 font-normal normal-case">(laisser vide si dropshipping)</span>
            </label>
            <input
              type="number"
              value={form.stock}
              onChange={e => set('stock', e.target.value)}
              placeholder="—"
              min="0"
              className="input"
            />
          </div>
        </div>

        {/* Fournisseur */}
        <div className="card space-y-3">
          <h2 className="font-bold text-navy text-sm">🏭 Source fournisseur</h2>
          <input
            type="url"
            value={form.supplier_url}
            onChange={e => set('supplier_url', e.target.value)}
            placeholder="https://aliexpress.com/item/..."
            className="input"
          />
          <p className="text-xs text-gray-400">Lien AliExpress, 1688 ou autre fournisseur (usage interne)</p>
        </div>

        {/* Statut */}
        <div className="flex gap-3">
          {(['active', 'draft'] as const).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => set('status', s)}
              className={cn(
                'flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all',
                form.status === s
                  ? s === 'active' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-300 bg-gray-50 text-gray-600'
                  : 'border-gray-200 text-gray-400 hover:border-gray-300'
              )}
            >
              {s === 'active' ? '✅ Activer directement' : '📝 Sauvegarder en brouillon'}
            </button>
          ))}
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
          ) : '+ Créer le produit'}
        </button>
      </form>
    </div>
  )
}
