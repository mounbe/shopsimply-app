// ═══════════════════════════════════════════════════════════════
// ShopSimply — Client API Youcan
// Doc officielle : https://docs.youcan.shop/api
// ═══════════════════════════════════════════════════════════════

const YOUCAN_API_BASE = 'https://youcan.shop/api/v2'

// ── Types Youcan ──────────────────────────────────────────────

export interface YoucanProduct {
  id: string
  name: string
  description: string | null
  price: number               // en centimes ou MAD direct — vérifier
  compare_price: number | null
  sku: string | null
  inventory_quantity: number | null
  status: 'published' | 'draft' | 'archived'
  images: Array<{ src: string; position: number }>
  categories: Array<{ id: string; name: string }>
  created_at: string
  updated_at: string
}

export interface YoucanOrder {
  id: string
  reference: string            // numéro de commande affiché
  status: string               // 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'returned'
  total: number
  currency: string             // 'MAD'
  payment_method: string       // 'cod' | 'cmi' | ...
  customer: {
    name: string
    email: string | null
    phone: string | null
  }
  shipping_address: {
    city: string | null
    address: string | null
  }
  items: Array<{
    product_id: string
    product_name: string
    quantity: number
    price: number
  }>
  notes: string | null
  created_at: string
  updated_at: string
}

export interface YoucanPagination<T> {
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

// ── Erreur typée ──────────────────────────────────────────────
export class YoucanAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message)
    this.name = 'YoucanAPIError'
  }
}

// ── Mappage des statuts Youcan → ShopSimply ───────────────────
const ORDER_STATUS_MAP: Record<string, string> = {
  pending:    'pending',
  processing: 'confirmed',
  confirmed:  'confirmed',
  shipped:    'shipped',
  delivered:  'delivered',
  cancelled:  'cancelled',
  returned:   'returned',
  refunded:   'returned',
}

const PRODUCT_STATUS_MAP: Record<string, string> = {
  published: 'active',
  draft:     'draft',
  archived:  'archived',
}

// ── Client principal ──────────────────────────────────────────
export class YoucanClient {
  private baseUrl: string
  private headers: Record<string, string>

  constructor(apiKey: string, storeSlug: string) {
    this.baseUrl = `${YOUCAN_API_BASE}/store/${storeSlug}`
    this.headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type':  'application/json',
      'Accept':        'application/json',
    }
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${path}`
    const res = await fetch(url, {
      ...options,
      headers: { ...this.headers, ...(options?.headers || {}) },
      // 15s timeout
      signal: AbortSignal.timeout(15_000),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new YoucanAPIError(
        body?.message || `Youcan API error ${res.status}`,
        res.status,
        body?.code
      )
    }

    return res.json()
  }

  // ── Test de connexion ───────────────────────────────────────
  async testConnection(): Promise<{ success: boolean; storeName?: string; error?: string }> {
    try {
      const data = await this.request<{ name: string; domain: string }>('/info')
      return { success: true, storeName: data.name }
    } catch (err) {
      if (err instanceof YoucanAPIError) {
        if (err.status === 401) return { success: false, error: 'Clé API invalide ou expirée' }
        if (err.status === 404) return { success: false, error: 'Boutique introuvable — vérifie le slug' }
        return { success: false, error: err.message }
      }
      return { success: false, error: 'Impossible de contacter Youcan' }
    }
  }

  // ── Produits ────────────────────────────────────────────────
  async getProducts(page = 1, perPage = 50): Promise<YoucanPagination<YoucanProduct>> {
    return this.request<YoucanPagination<YoucanProduct>>(
      `/products?page=${page}&per_page=${perPage}&sort=updated_at:desc`
    )
  }

  async getAllProducts(): Promise<YoucanProduct[]> {
    const all: YoucanProduct[] = []
    let page = 1
    let lastPage = 1

    do {
      const res = await this.getProducts(page, 100)
      all.push(...res.data)
      lastPage = res.meta.last_page
      page++
    } while (page <= lastPage && page <= 10) // max 1000 produits

    return all
  }

  // ── Commandes ───────────────────────────────────────────────
  async getOrders(page = 1, perPage = 50, since?: string): Promise<YoucanPagination<YoucanOrder>> {
    const sinceParam = since ? `&created_after=${since}` : ''
    return this.request<YoucanPagination<YoucanOrder>>(
      `/orders?page=${page}&per_page=${perPage}&sort=created_at:desc${sinceParam}`
    )
  }

  async getRecentOrders(since?: string): Promise<YoucanOrder[]> {
    const all: YoucanOrder[] = []
    let page = 1
    let lastPage = 1

    do {
      const res = await this.getOrders(page, 100, since)
      all.push(...res.data)
      lastPage = res.meta.last_page
      page++
    } while (page <= lastPage && page <= 5) // max 500 commandes récentes

    return all
  }

  // ── Mise à jour statut commande ─────────────────────────────
  async updateOrderStatus(orderId: string, status: string): Promise<void> {
    await this.request(`/orders/${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  }
}


// ── Fonctions de mapping vers notre schéma ────────────────────

export function mapYoucanProduct(yp: YoucanProduct, userId: string, shopId?: string) {
  return {
    user_id:           userId,
    shop_id:           shopId || null,
    name:              yp.name,
    description:       yp.description || null,
    buying_price:      0,                       // non exposé par Youcan API
    selling_price:     yp.price / 100,          // Youcan stocke en centimes
    stock:             yp.inventory_quantity,
    category:          yp.categories?.[0]?.name || null,
    image_url:         yp.images?.[0]?.src || null,
    status:            PRODUCT_STATUS_MAP[yp.status] || 'draft',
    external_id:       yp.id,
    external_platform: 'youcan',
    updated_at:        new Date().toISOString(),
  }
}

export function mapYoucanOrder(yo: YoucanOrder, userId: string, shopId?: string, clientId?: string) {
  return {
    user_id:           userId,
    shop_id:           shopId || null,
    client_id:         clientId || null,
    product_name:      yo.items?.[0]?.product_name || null,
    amount:            yo.total,
    status:            ORDER_STATUS_MAP[yo.status] || 'pending',
    payment_method:    yo.payment_method?.toLowerCase() === 'cod' ? 'cod' : 'cod',
    city:              yo.shipping_address?.city || null,
    notes:             yo.notes || null,
    external_id:       yo.id,
    external_platform: 'youcan',
    updated_at:        new Date().toISOString(),
  }
}

export function mapYoucanClientFromOrder(yo: YoucanOrder, userId: string, shopId?: string) {
  return {
    user_id:  userId,
    shop_id:  shopId || null,
    name:     yo.customer.name,
    phone:    yo.customer.phone || null,
    email:    yo.customer.email || null,
    city:     yo.shipping_address?.city || null,
  }
}
