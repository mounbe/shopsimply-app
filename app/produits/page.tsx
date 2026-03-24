'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Plus, Package } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Skeleton'

interface Product {
  id: string
  name: string
  description: string | null
  buying_price: number
  selling_price: number
  stock: number | null
  category: string | null
  image_url: string | null
  status: 'active' | 'draft' | 'archived'
}

const STATUS_CONFIG = {
  active:   { label: 'Actif',    bg: 'bg-green-100',  text: 'text-green-700' },
  draft:    { label: 'Brouillon', bg: 'bg-gray-100',   text: 'text-gray-600' },
  archived: { label: 'Archivé',  bg: 'bg-red-50',     text: 'text-red-600' },
}

function ProductSkeleton() {
  return (
    <div className="card flex items-center gap-3">
      <Skeleton className="w-14 h-14 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="text-right space-y-1">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  )
}

export default function ProduitsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('products')
      .select('id, name, description, buying_price, selling_price, stock, category, image_url, status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setProducts(data || [])
    setLoading(false)
  }

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || p.status === statusFilter
    return matchSearch && matchStatus
  })

  const margin = (p: Product) => {
    if (p.selling_price <= 0) return 0
    return Math.round(((p.selling_price - p.buying_price) / p.selling_price) * 100)
  }

  const activeCount = products.filter(p => p.status === 'active').length

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-navy px-5 py-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-black text-white">Mes produits</h1>
            <p className="text-blue-200 text-xs mt-0.5">{activeCount} produit{activeCount !== 1 ? 's' : ''} actif{activeCount !== 1 ? 's' : ''}</p>
          </div>
          <Link
            href="/produits/nouveau"
            className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/30"
          >
            <Plus className="w-5 h-5 text-white" />
          </Link>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total', value: products.length.toString() },
            { label: 'Actifs', value: activeCount.toString() },
            { label: 'Marge moy.', value: products.length > 0
              ? `${Math.round(products.filter(p => p.status === 'active').reduce((s, p) => s + margin(p), 0) / Math.max(activeCount, 1))}%`
              : '—'
            },
          ].map(s => (
            <div key={s.label} className="bg-white/10 rounded-xl p-2 text-center">
              <div className="text-white font-black text-base">{s.value}</div>
              <div className="text-blue-200 text-[10px]">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>

        {/* Filtres */}
        <div className="flex gap-2">
          {[null, 'active', 'draft', 'archived'].map(s => (
            <button
              key={s ?? 'all'}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all',
                statusFilter === s
                  ? 'bg-navy text-white border-navy'
                  : 'bg-white text-gray-500 border-gray-200'
              )}
            >
              {s === null ? 'Tous' : STATUS_CONFIG[s as keyof typeof STATUS_CONFIG].label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && [1, 2, 3].map(i => <ProductSkeleton key={i} />)}

        {/* Empty state */}
        {!loading && products.length === 0 && (
          <div className="card text-center py-12">
            <div className="text-5xl mb-3">📦</div>
            <div className="font-bold text-navy mb-1">Aucun produit encore</div>
            <p className="text-sm text-gray-400 mb-4">
              Ajoute tes produits pour suivre tes marges et générer des fiches automatiquement avec l&apos;IA.
            </p>
            <Link href="/produits/nouveau" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Ajouter un produit
            </Link>
          </div>
        )}

        {/* Product list */}
        {!loading && filtered.map(product => {
          const m = margin(product)
          return (
            <Link
              key={product.id}
              href={`/produits/${product.id}`}
              className="card flex items-center gap-3 hover:shadow-md transition-shadow"
            >
              {/* Image / placeholder */}
              <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {product.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-6 h-6 text-gray-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-bold text-navy text-sm truncate">{product.name}</div>
                {product.category && (
                  <div className="text-xs text-gray-400 mt-0.5">{product.category}</div>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded-full',
                    STATUS_CONFIG[product.status].bg,
                    STATUS_CONFIG[product.status].text
                  )}>
                    {STATUS_CONFIG[product.status].label}
                  </span>
                  {product.stock !== null && (
                    <span className={cn(
                      'text-[10px] font-semibold',
                      product.stock === 0 ? 'text-red-500' : product.stock < 5 ? 'text-amber-500' : 'text-gray-400'
                    )}>
                      {product.stock === 0 ? '❌ Rupture' : `Stock: ${product.stock}`}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <div className="font-black text-accent text-sm">{product.selling_price} MAD</div>
                <div className="text-xs text-gray-400">achat: {product.buying_price} MAD</div>
                <div className={cn(
                  'text-xs font-bold mt-0.5',
                  m >= 30 ? 'text-green-600' : m >= 15 ? 'text-blue-600' : 'text-amber-600'
                )}>
                  marge: {m}%
                </div>
              </div>
            </Link>
          )
        })}

        {!loading && filtered.length === 0 && products.length > 0 && (
          <div className="card text-center py-8">
            <div className="text-3xl mb-2">🔍</div>
            <div className="font-semibold text-navy">Aucun résultat</div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <nav className="flex border-t border-gray-100 bg-white py-2 sticky bottom-0">
        {[
          { href: '/dashboard', icon: '🏠', label: 'Accueil', active: false },
          { href: '/plan', icon: '📋', label: 'Plan', active: false },
          { href: '/assistant', icon: '🤖', label: 'IA', active: false },
          { href: '/crm', icon: '👥', label: 'CRM', active: false },
          { href: '/profil', icon: '⚙️', label: 'Profil', active: false },
        ].map(item => (
          <Link key={item.label} href={item.href} className="flex-1 flex flex-col items-center gap-0.5 py-1">
            <span className="text-xl">{item.icon}</span>
            <span className={cn('text-[10px] font-bold', item.active ? 'text-accent' : 'text-gray-400')}>
              {item.label}
            </span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
