'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, RefreshCw, CheckCircle, XCircle, Loader, AlertTriangle, Clock, Package, ShoppingCart, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────
interface Integration {
  id: string
  platform: string
  api_key: string | null
  store_slug: string | null
  store_url: string | null
  status: 'connected' | 'disconnected' | 'error' | 'syncing'
  last_sync_at: string | null
  last_error: string | null
}

interface SyncLog {
  id: string
  type: 'products' | 'orders' | 'full'
  status: 'success' | 'partial' | 'error'
  items_synced: number
  items_failed: number
  duration_ms: number | null
  created_at: string
}

interface SyncResult {
  success: boolean
  synced?: number
  orders_synced?: number
  clients_created?: number
  total?: number
  duration_ms?: number
  error?: string
  errors?: string[]
}

// ── Helpers ───────────────────────────────────────────────────
function formatDuration(ms: number | null): string {
  if (!ms) return '—'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function formatDate(iso: string | null): string {
  if (!iso) return 'Jamais'
  const d = new Date(iso)
  return d.toLocaleDateString('fr-MA', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

const STATUS_CONFIG = {
  connected:    { color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200', icon: CheckCircle, label: 'Connecté' },
  disconnected: { color: 'text-gray-400',   bg: 'bg-gray-50',   border: 'border-gray-200',  icon: XCircle,     label: 'Non connecté' },
  error:        { color: 'text-red-500',    bg: 'bg-red-50',    border: 'border-red-200',   icon: AlertTriangle, label: 'Erreur' },
  syncing:      { color: 'text-blue-500',   bg: 'bg-blue-50',   border: 'border-blue-200',  icon: Loader,      label: 'Synchronisation…' },
}

// ── Main Page ─────────────────────────────────────────────────
export default function IntegrationsPage() {
  const supabase = createClient()
  const { toast } = useToast()

  const [integration, setIntegration] = useState<Integration | null>(null)
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([])
  const [loading, setLoading] = useState(true)

  // Formulaire Youcan
  const [apiKey, setApiKey] = useState('')
  const [storeSlug, setStoreSlug] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [syncingProducts, setSyncingProducts] = useState(false)
  const [syncingOrders, setSyncingOrders] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: intData } = await supabase
      .from('integrations')
      .select('*')
      .eq('platform', 'youcan')
      .maybeSingle()

    if (intData) {
      setIntegration(intData)
      setApiKey(intData.api_key || '')
      setStoreSlug(intData.store_slug || '')

      // Récupérer les logs de sync
      const { data: logsData } = await supabase
        .from('sync_logs')
        .select('*')
        .eq('integration_id', intData.id)
        .order('created_at', { ascending: false })
        .limit(10)

      setSyncLogs(logsData || [])
    }

    setLoading(false)
  }

  // ── Test connexion ─────────────────────────────────────────
  const handleTest = async () => {
    if (!apiKey.trim() || !storeSlug.trim()) {
      toast({ type: 'error', message: 'Remplis la clé API et le slug de ta boutique' })
      return
    }

    setTesting(true)
    const toastId = toast({ type: 'loading', message: 'Test de connexion Youcan…', duration: 0 })

    try {
      const res = await fetch('/api/youcan/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, storeSlug }),
      })
      const data = await res.json()

      if (data.success) {
        toast({ id: toastId, type: 'success', message: `Connecté à "${data.storeName || storeSlug}" ✅` })
        await loadData()
      } else {
        toast({ id: toastId, type: 'error', message: data.error || 'Connexion échouée' })
      }
    } catch {
      toast({ id: toastId, type: 'error', message: 'Erreur réseau — vérifie ta connexion' })
    } finally {
      setTesting(false)
    }
  }

  // ── Sync produits ──────────────────────────────────────────
  const handleSyncProducts = async () => {
    if (integration?.status !== 'connected') {
      toast({ type: 'error', message: 'Connecte d\'abord ta boutique Youcan' })
      return
    }

    setSyncingProducts(true)
    const toastId = toast({ type: 'loading', message: 'Synchronisation des produits…', duration: 0 })

    try {
      const res = await fetch('/api/youcan/sync-products', { method: 'POST' })
      const data: SyncResult = await res.json()

      if (data.success) {
        toast({
          id: toastId,
          type: 'success',
          message: `${data.synced} produit(s) synchronisé(s) en ${formatDuration(data.duration_ms ?? null)}`,
        })
      } else if (data.error) {
        toast({ id: toastId, type: 'error', message: data.error })
      } else {
        toast({ id: toastId, type: 'info', message: `Sync partielle : ${data.synced} ok / ${data.total} total` })
      }

      await loadData()
    } catch {
      toast({ id: toastId, type: 'error', message: 'Erreur lors de la synchronisation' })
    } finally {
      setSyncingProducts(false)
    }
  }

  // ── Sync commandes ─────────────────────────────────────────
  const handleSyncOrders = async () => {
    if (integration?.status !== 'connected') {
      toast({ type: 'error', message: 'Connecte d\'abord ta boutique Youcan' })
      return
    }

    setSyncingOrders(true)
    const toastId = toast({ type: 'loading', message: 'Synchronisation des commandes…', duration: 0 })

    try {
      const res = await fetch('/api/youcan/sync-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ since: integration.last_sync_at }),
      })
      const data: SyncResult = await res.json()

      if (data.success) {
        toast({
          id: toastId,
          type: 'success',
          message: `${data.orders_synced} commande(s) · ${data.clients_created} client(s) créé(s)`,
        })
      } else if (data.error) {
        toast({ id: toastId, type: 'error', message: data.error })
      } else {
        toast({ id: toastId, type: 'info', message: `Sync partielle : ${data.orders_synced} commandes ok` })
      }

      await loadData()
    } catch {
      toast({ id: toastId, type: 'error', message: 'Erreur lors de la synchronisation' })
    } finally {
      setSyncingOrders(false)
    }
  }

  // ── Déconnecter ────────────────────────────────────────────
  const handleDisconnect = async () => {
    if (!integration) return
    await supabase
      .from('integrations')
      .update({ status: 'disconnected', api_key: null, updated_at: new Date().toISOString() })
      .eq('id', integration.id)

    setApiKey('')
    toast({ type: 'info', message: 'Intégration Youcan déconnectée' })
    await loadData()
  }

  const statusCfg = integration ? STATUS_CONFIG[integration.status] : STATUS_CONFIG.disconnected
  const StatusIcon = statusCfg.icon

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-navy px-5 pt-5 pb-6">
        <Link href="/profil" className="flex items-center gap-2 text-blue-200 text-sm mb-4 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Profil
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-xl">🔗</div>
          <div>
            <h1 className="text-xl font-black text-white">Intégrations</h1>
            <p className="text-blue-200 text-xs mt-0.5">Connecte ta boutique pour sync auto</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-5 space-y-4">

        {/* ── Carte Youcan ──────────────────────────────────── */}
        <div className="card space-y-5">
          {/* Logo + statut */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-50 border-2 border-orange-100 rounded-2xl flex items-center justify-center text-2xl font-black text-orange-500">Y</div>
              <div>
                <div className="font-black text-navy text-base">Youcan</div>
                <div className="text-gray-400 text-xs">Plateforme e-commerce marocaine</div>
              </div>
            </div>
            <div className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border', statusCfg.bg, statusCfg.border, statusCfg.color)}>
              <StatusIcon className={cn('w-3.5 h-3.5', integration?.status === 'syncing' && 'animate-spin')} />
              {statusCfg.label}
            </div>
          </div>

          {/* Dernier sync */}
          {integration?.last_sync_at && (
            <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-2">
              <Clock className="w-3.5 h-3.5" />
              Dernière sync : {formatDate(integration.last_sync_at)}
            </div>
          )}

          {/* Erreur */}
          {integration?.status === 'error' && integration.last_error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-600">
              ⚠️ {integration.last_error}
            </div>
          )}

          {/* Formulaire */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-navy mb-1.5">
                Slug de ta boutique Youcan
              </label>
              <input
                type="text"
                value={storeSlug}
                onChange={e => setStoreSlug(e.target.value.toLowerCase().replace(/\s/g, '-'))}
                placeholder="ma-boutique"
                className="input-field"
              />
              <p className="text-xs text-gray-400 mt-1">
                Ex : si ton URL est <span className="font-mono">ma-boutique.youcan.shop</span>, saisis <span className="font-mono font-bold">ma-boutique</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy mb-1.5">
                Clé API Youcan
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="yc_live_xxxxxxxxxxxxxxxx"
                  className="input-field pr-10 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Paramètres Youcan → Développeurs → Clés API → Créer une clé
              </p>
            </div>
          </div>

          {/* Bouton test */}
          <button
            onClick={handleTest}
            disabled={testing || !apiKey.trim() || !storeSlug.trim()}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {testing ? (
              <><Loader className="w-4 h-4 animate-spin" /> Test en cours…</>
            ) : (
              <>🔌 Tester la connexion</>
            )}
          </button>

          {/* Déconnecter */}
          {integration?.status === 'connected' && (
            <button
              onClick={handleDisconnect}
              className="w-full text-center text-xs text-red-400 hover:text-red-600 font-semibold py-1 transition-colors"
            >
              Déconnecter Youcan
            </button>
          )}
        </div>

        {/* ── Actions sync ──────────────────────────────────── */}
        {integration?.status === 'connected' && (
          <div className="card space-y-3">
            <h2 className="font-black text-navy text-sm">Synchronisation manuelle</h2>
            <p className="text-xs text-gray-400">
              Importe les données de ta boutique Youcan dans ShopSimply. La sync est incrémentale — seules les nouvelles données sont importées.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {/* Sync produits */}
              <button
                onClick={handleSyncProducts}
                disabled={syncingProducts || syncingOrders}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-2xl border-2 text-center transition-all',
                  syncingProducts
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-accent hover:bg-orange-50'
                )}
              >
                {syncingProducts ? (
                  <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
                ) : (
                  <Package className="w-6 h-6 text-navy" />
                )}
                <div>
                  <div className="text-xs font-black text-navy">
                    {syncingProducts ? 'Sync…' : 'Produits'}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    Catalogue Youcan → ShopSimply
                  </div>
                </div>
              </button>

              {/* Sync commandes */}
              <button
                onClick={handleSyncOrders}
                disabled={syncingProducts || syncingOrders}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-2xl border-2 text-center transition-all',
                  syncingOrders
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-accent hover:bg-orange-50'
                )}
              >
                {syncingOrders ? (
                  <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
                ) : (
                  <ShoppingCart className="w-6 h-6 text-navy" />
                )}
                <div>
                  <div className="text-xs font-black text-navy">
                    {syncingOrders ? 'Sync…' : 'Commandes'}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    Commandes + clients Youcan
                  </div>
                </div>
              </button>
            </div>

            <div className="bg-blue-50 rounded-xl px-3 py-2.5 flex items-start gap-2">
              <span className="text-blue-500 text-base mt-0.5">💡</span>
              <p className="text-xs text-blue-600">
                Les produits et commandes importés sont marqués <span className="font-bold">youcan</span> — ils ne sont jamais dupliqués lors des prochaines syncs.
              </p>
            </div>
          </div>
        )}

        {/* ── Historique des syncs ──────────────────────────── */}
        {syncLogs.length > 0 && (
          <div className="card">
            <h2 className="font-black text-navy text-sm mb-3">Historique des synchronisations</h2>
            <div className="divide-y divide-gray-50">
              {syncLogs.map(log => (
                <div key={log.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className={cn(
                    'w-2 h-2 rounded-full flex-shrink-0',
                    log.status === 'success' ? 'bg-green-500' :
                    log.status === 'partial' ? 'bg-yellow-400' : 'bg-red-400'
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-navy capitalize">{log.type}</span>
                      <span className={cn(
                        'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                        log.status === 'success' ? 'bg-green-100 text-green-700' :
                        log.status === 'partial' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'
                      )}>
                        {log.status === 'success' ? 'Succès' : log.status === 'partial' ? 'Partielle' : 'Erreur'}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      {log.items_synced} syncs · {formatDuration(log.duration_ms)} · {formatDate(log.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Autres plateformes — bientôt ─────────────────── */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Bientôt disponible</p>
          {[
            { name: 'Shopify', icon: '🟢', desc: 'Sync produits, commandes et analytics Shopify' },
            { name: 'WooCommerce', icon: '🔵', desc: 'Sync avec WordPress + WooCommerce' },
          ].map(p => (
            <div key={p.name} className="card flex items-center gap-4 opacity-50 mb-3">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-2xl">{p.icon}</div>
              <div>
                <div className="font-black text-navy text-sm">{p.name}</div>
                <div className="text-gray-400 text-xs">{p.desc}</div>
              </div>
              <span className="ml-auto text-[10px] bg-gray-100 text-gray-400 font-bold px-2 py-1 rounded-full">Bientôt</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
