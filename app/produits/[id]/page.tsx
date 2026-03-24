'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Package, Sparkles, Trash2, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Skeleton'

const CATEGORIES = ['Beauté & Soins', 'Mode & Vêtements', 'Maison & Déco', 'Sport & Fitness', 'Électronique', 'Alimentation', 'Bébé & Enfants', 'Autre']

interface Product {
  id: string
  name: string
  description: string | null
  buying_price: number
  selling_price: number
  stock: number | null
  category: string | null
  image_url: string | null
  supplier_url: string | null
  status: 'active' | 'draft' | 'archived'
}

export default function EditProduitPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const supabase = createClient()
  const { success, error: toastError, loading: toastLoading, dismiss } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generatingAI, setGeneratingAI] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [scoring, setScoring] = useState(false)
  const [scoreResult, setScoreResult] = useState<{ score: number; verdict: string; summary: string; label: string } | null>(null)
  const [form, setForm] = useState({
    name: '',
    description: '',
    buying_price: '',
    selling_price: '',
    stock: '',
    category: '',
    supplier_url: '',
    status: 'active' as 'active' | 'draft' | 'archived',
  })

  useEffect(() => {
    loadProduct()
  }, [id])

  const loadProduct = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      toastError('Produit introuvable')
      router.push('/produits')
      return
    }

    const p = data as Product
    setForm({
      name: p.name,
      description: p.description || '',
      buying_price: p.buying_price.toString(),
      selling_price: p.selling_price.toString(),
      stock: p.stock !== null ? p.stock.toString() : '',
      category: p.category || '',
      supplier_url: p.supplier_url || '',
      status: p.status,
    })
    setLoading(false)
  }

  const set = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const margin = () => {
    const bp = parseFloat(form.buying_price) || 0
    const sp = parseFloat(form.selling_price) || 0
    if (sp <= 0) return null
    return Math.round(((sp - bp) / sp) * 100)
  }

  const generateDescription = async () => {
    if (!form.name.trim()) { toastError('Nom requis pour générer'); return }
    setGeneratingAI(true)
    const tid = toastLoading('Génération en cours...')
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `Génère une description produit courte et percutante (max 120 mots) pour "${form.name}" à vendre sur une boutique e-commerce marocaine. ${form.category ? `Catégorie: ${form.category}.` : ''} En français, bénéfices en avant, rassure sur la qualité, incite à l'achat en COD. Réponds UNIQUEMENT avec la description.` }],
          context: { userName: 'ShopSimply', niche: 'e-commerce', platform: 'Youcan' },
        }),
      })
      if (!response.body) throw new Error()
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let content = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        for (const line of decoder.decode(value).split('\n')) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try { const p = JSON.parse(line.slice(6)); if (p.text) content += p.text } catch {}
          }
        }
      }
      set('description', content.trim())
      dismiss(tid)
      success('Description régénérée !')
    } catch {
      dismiss(tid)
      toastError('Erreur lors de la génération')
    } finally {
      setGeneratingAI(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.selling_price) return
    setSaving(true)

    const { error } = await supabase
      .from('products')
      .update({
        name: form.name.trim(),
        description: form.description.trim() || null,
        buying_price: parseFloat(form.buying_price) || 0,
        selling_price: parseFloat(form.selling_price),
        stock: form.stock ? parseInt(form.stock) : null,
        category: form.category || null,
        supplier_url: form.supplier_url.trim() || null,
        status: form.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    setSaving(false)
    if (error) toastError('Erreur lors de la sauvegarde')
    else success('Produit mis à jour !')
  }

  const handleScoreProduct = async () => {
    if (!form.name.trim()) { toastError('Nom du produit requis'); return }
    setScoring(true)
    const tid = toastLoading('Analyse IA du produit…')
    try {
      const res = await fetch('/api/score-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: form.name,
          buyingPrice: parseFloat(form.buying_price) || undefined,
          sellingPrice: parseFloat(form.selling_price) || undefined,
          category: form.category || undefined,
          description: form.description || undefined,
        }),
      })
      const data = await res.json()
      dismiss(tid)
      if (res.ok) {
        setScoreResult({ score: data.score, verdict: data.verdict, summary: data.summary, label: data.label })
        success(`Score calculé : ${data.score}/10`)
      } else {
        toastError(data.message || 'Erreur scoring')
      }
    } catch {
      dismiss(tid)
      toastError('Erreur réseau')
    } finally {
      setScoring(false)
    }
  }

  const handleDelete = async () => {
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) { toastError('Erreur suppression'); return }
    success('Produit supprimé')
    router.push('/produits')
  }

  const m = margin()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col max-w-2xl mx-auto">
        <div className="bg-navy px-5 py-5 flex items-center gap-3">
          <Skeleton className="w-5 h-5 bg-white/20" />
          <Skeleton className="h-6 w-32 bg-white/20" />
        </div>
        <div className="px-4 py-5 space-y-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-2xl mx-auto">
      <div className="bg-navy px-5 py-5 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-blue-200 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
          <Package className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-white font-black truncate">{form.name || 'Éditer produit'}</h1>
          <p className="text-blue-200 text-xs">Modifier les informations</p>
        </div>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="w-9 h-9 bg-red-500/20 rounded-xl flex items-center justify-center hover:bg-red-500/40 transition-colors"
        >
          <Trash2 className="w-4 h-4 text-red-400" />
        </button>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm">
            <div className="text-3xl mb-3 text-center">⚠️</div>
            <h2 className="font-black text-navy text-center mb-2">Supprimer ce produit ?</h2>
            <p className="text-sm text-gray-400 text-center mb-5">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 btn-secondary py-3 text-sm">Annuler</button>
              <button onClick={handleDelete} className="flex-1 bg-red-500 text-white font-bold py-3 rounded-2xl text-sm hover:opacity-90">Supprimer</button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="flex-1 px-4 py-5 space-y-4">
        <div className="card space-y-4">
          <h2 className="font-bold text-navy text-sm">📦 Informations</h2>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Nom du produit *</label>
            <input type="text" value={form.name} onChange={e => set('name', e.target.value)} required className="input" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Description</label>
              <button type="button" onClick={generateDescription} disabled={generatingAI || !form.name.trim()}
                className={cn('flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all',
                  generatingAI ? 'bg-gray-100 text-gray-400' : form.name.trim() ? 'bg-teal-brand/10 text-teal-brand hover:bg-teal-brand/20' : 'bg-gray-100 text-gray-300 cursor-not-allowed')}>
                {generatingAI ? <><span className="w-3 h-3 border-2 border-teal-brand/50 border-t-teal-brand rounded-full animate-spin" /> Génération...</> : <><Sparkles className="w-3 h-3" /> Régénérer IA</>}
              </button>
            </div>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4}
              placeholder="Description du produit..." className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 resize-none focus:outline-none focus:border-accent transition-colors" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Catégorie</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button key={cat} type="button" onClick={() => set('category', form.category === cat ? '' : cat)}
                  className={cn('px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all',
                    form.category === cat ? 'border-accent bg-orange-50 text-accent' : 'border-gray-200 text-gray-500')}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="font-bold text-navy text-sm">💰 Prix &amp; Marge</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Prix fournisseur</label>
              <div className="relative">
                <input type="number" value={form.buying_price} onChange={e => set('buying_price', e.target.value)} placeholder="60" min="0" className="input pr-14" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">MAD</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Prix de vente *</label>
              <div className="relative">
                <input type="number" value={form.selling_price} onChange={e => set('selling_price', e.target.value)} placeholder="199" min="0" required className="input pr-14" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">MAD</span>
              </div>
            </div>
          </div>
          {m !== null && (
            <div className={cn('flex items-center justify-between rounded-xl px-4 py-3 border-2',
              m >= 30 ? 'bg-green-50 border-green-200' : m >= 15 ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200')}>
              <span className="text-sm font-semibold text-gray-600">Marge brute</span>
              <span className={cn('font-black text-lg', m >= 30 ? 'text-green-700' : m >= 15 ? 'text-blue-700' : 'text-amber-700')}>
                {m}% {m >= 30 ? '🚀' : m >= 15 ? '✅' : '⚠️'}
              </span>
            </div>
          )}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Stock <span className="text-gray-400 font-normal normal-case">(vide = dropshipping)</span></label>
            <input type="number" value={form.stock} onChange={e => set('stock', e.target.value)} placeholder="—" min="0" className="input" />
          </div>
        </div>

        <div className="card space-y-3">
          <h2 className="font-bold text-navy text-sm">🏭 Fournisseur</h2>
          <input type="url" value={form.supplier_url} onChange={e => set('supplier_url', e.target.value)} placeholder="https://aliexpress.com/item/..." className="input" />
        </div>

        <div className="flex gap-3">
          {(['active', 'draft', 'archived'] as const).map(s => (
            <button key={s} type="button" onClick={() => set('status', s)}
              className={cn('flex-1 py-2.5 rounded-xl border-2 font-bold text-xs transition-all',
                form.status === s
                  ? s === 'active' ? 'border-green-500 bg-green-50 text-green-700' : s === 'draft' ? 'border-gray-300 bg-gray-50 text-gray-600' : 'border-red-300 bg-red-50 text-red-600'
                  : 'border-gray-200 text-gray-400')}>
              {s === 'active' ? '✅ Actif' : s === 'draft' ? '📝 Brouillon' : '🗃️ Archivé'}
            </button>
          ))}
        </div>

        {/* Score produit IA */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-navy text-sm flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400" />
              Score produit IA
            </h2>
            <button
              type="button"
              onClick={handleScoreProduct}
              disabled={scoring || !form.name.trim()}
              className={cn(
                'flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all',
                scoring ? 'bg-gray-100 text-gray-400'
                : 'bg-yellow-400/20 text-yellow-700 hover:bg-yellow-400/30'
              )}
            >
              {scoring ? (
                <><span className="w-3 h-3 border-2 border-yellow-500/50 border-t-yellow-500 rounded-full animate-spin" /> Analyse…</>
              ) : (
                <>⭐ Analyser</>
              )}
            </button>
          </div>

          {scoreResult ? (
            <div className={cn(
              'rounded-xl p-3 border-2',
              scoreResult.verdict === 'excellent' ? 'bg-green-50 border-green-200' :
              scoreResult.verdict === 'bon' ? 'bg-blue-50 border-blue-200' :
              scoreResult.verdict === 'moyen' ? 'bg-yellow-50 border-yellow-200' :
              'bg-red-50 border-red-200'
            )}>
              <div className="flex items-center gap-3 mb-2">
                <div className="text-3xl font-black text-navy">{scoreResult.score.toFixed(1)}<span className="text-sm text-gray-400">/10</span></div>
                <div>
                  <div className="font-black text-sm text-navy">{scoreResult.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{scoreResult.summary}</div>
                </div>
              </div>
              <a
                href={`/outils/scoring-produit`}
                className="text-xs font-bold text-accent hover:underline"
              >
                Voir l&apos;analyse complète →
              </a>
            </div>
          ) : (
            <p className="text-xs text-gray-400">
              Clique sur "Analyser" pour obtenir un score /10 et des conseils IA pour ce produit sur le marché marocain.
            </p>
          )}
        </div>

        <button type="submit" disabled={saving} className={cn('btn-primary', saving && 'opacity-60')}>
          {saving ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />Sauvegarde...</span> : 'Enregistrer les modifications'}
        </button>
      </form>
    </div>
  )
}
