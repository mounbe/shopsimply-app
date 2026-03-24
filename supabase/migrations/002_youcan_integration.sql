-- ═══════════════════════════════════════════════════════════════
-- ShopSimply — Migration 002 : Intégrations plateformes e-commerce
-- ═══════════════════════════════════════════════════════════════

-- ── TABLE INTEGRATIONS ────────────────────────────────────────
-- Stocke les credentials et config par plateforme
CREATE TABLE integrations (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shop_id      UUID REFERENCES shops(id) ON DELETE CASCADE,
  platform     TEXT NOT NULL CHECK (platform IN ('youcan', 'shopify', 'woocommerce', 'autre')),
  api_key      TEXT,              -- clé API chiffrée (à chiffrer côté app)
  store_slug   TEXT,              -- ex: "ma-boutique" pour Youcan
  store_url    TEXT,              -- URL complète de la boutique
  webhook_url  TEXT,              -- URL webhook ShopSimply pour cette boutique
  status       TEXT DEFAULT 'disconnected'
               CHECK (status IN ('connected', 'disconnected', 'error', 'syncing')),
  last_sync_at TIMESTAMPTZ,
  last_error   TEXT,
  sync_config  JSONB DEFAULT '{"auto_sync": false, "sync_products": true, "sync_orders": true, "sync_interval_minutes": 60}'::JSONB,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own integrations" ON integrations
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_integrations_user_id ON integrations(user_id);
CREATE INDEX idx_integrations_platform ON integrations(user_id, platform);


-- ── TABLE SYNC LOGS ───────────────────────────────────────────
-- Historique des synchronisations
CREATE TABLE sync_logs (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  integration_id  UUID REFERENCES integrations(id) ON DELETE CASCADE NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('products', 'orders', 'full')),
  status          TEXT NOT NULL CHECK (status IN ('success', 'partial', 'error')),
  items_synced    INTEGER DEFAULT 0,
  items_failed    INTEGER DEFAULT 0,
  error_message   TEXT,
  duration_ms     INTEGER,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own sync logs" ON sync_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sync logs" ON sync_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_sync_logs_integration ON sync_logs(integration_id, created_at DESC);


-- ── COLONNE EXTERNAL_ID SUR PRODUCTS ET ORDERS ────────────────
-- Pour mapper les IDs Youcan avec nos IDs internes
ALTER TABLE products ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS external_platform TEXT;
ALTER TABLE orders   ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE orders   ADD COLUMN IF NOT EXISTS external_platform TEXT;

-- Index pour éviter les doublons lors des syncs
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_external
  ON products(user_id, external_platform, external_id)
  WHERE external_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_external
  ON orders(user_id, external_platform, external_id)
  WHERE external_id IS NOT NULL;


-- ── FONCTION UPSERT SYNC LOG ──────────────────────────────────
CREATE OR REPLACE FUNCTION log_sync_result(
  p_user_id       UUID,
  p_integration_id UUID,
  p_type          TEXT,
  p_status        TEXT,
  p_items_synced  INTEGER,
  p_items_failed  INTEGER,
  p_error_message TEXT DEFAULT NULL,
  p_duration_ms   INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO sync_logs (
    user_id, integration_id, type, status,
    items_synced, items_failed, error_message, duration_ms
  ) VALUES (
    p_user_id, p_integration_id, p_type, p_status,
    p_items_synced, p_items_failed, p_error_message, p_duration_ms
  );

  -- Mettre à jour le statut de l'intégration
  UPDATE integrations
  SET
    status       = CASE WHEN p_status = 'error' THEN 'error' ELSE 'connected' END,
    last_sync_at = NOW(),
    last_error   = p_error_message,
    updated_at   = NOW()
  WHERE id = p_integration_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
