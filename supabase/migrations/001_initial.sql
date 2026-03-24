-- ═══════════════════════════════════════════════════════════════
-- ShopSimply — Migration initiale complète v1.0
-- Tables : profiles, shops, plans, tasks, clients, orders,
--          products, diagnostic_sessions, analytics_snapshots, ai_usage
-- ═══════════════════════════════════════════════════════════════

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─────────────────────────────────────────────────────────────
-- 1. PROFILES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE profiles (
  id                   UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email                TEXT NOT NULL,
  full_name            TEXT,
  plan                 TEXT DEFAULT 'trial' CHECK (plan IN ('trial', 'starter', 'pro', 'scale')),
  trial_ends_at        TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile"   ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();


-- ─────────────────────────────────────────────────────────────
-- 2. DIAGNOSTIC SESSIONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE diagnostic_sessions (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  answers    JSONB NOT NULL DEFAULT '[]',
  result     JSONB,
  completed  BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE diagnostic_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own diagnostics" ON diagnostic_sessions
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Allow anonymous insert" ON diagnostic_sessions
  FOR INSERT WITH CHECK (user_id IS NULL);


-- ─────────────────────────────────────────────────────────────
-- 3. SHOPS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE shops (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name       TEXT NOT NULL,
  platform   TEXT NOT NULL CHECK (platform IN ('youcan', 'shopify', 'woocommerce', 'autre')),
  niche      TEXT NOT NULL,
  model      TEXT NOT NULL CHECK (model IN ('dropshipping', 'reseller', 'private_label', 'autre')),
  url        TEXT,
  status     TEXT DEFAULT 'setup' CHECK (status IN ('setup', 'active', 'paused')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own shops" ON shops
  FOR ALL USING (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────
-- 4. PLANS 30 JOURS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE plans (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shop_id      UUID REFERENCES shops(id) ON DELETE CASCADE,
  niche        TEXT NOT NULL,
  model        TEXT NOT NULL,
  platform     TEXT NOT NULL,
  weeks        JSONB NOT NULL DEFAULT '[]',
  progress_pct INTEGER DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  current_week INTEGER DEFAULT 1,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own plans" ON plans
  FOR ALL USING (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────
-- 5. TASKS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE tasks (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  plan_id      UUID REFERENCES plans(id) ON DELETE CASCADE NOT NULL,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  week_number  INTEGER NOT NULL,
  title        TEXT NOT NULL,
  why          TEXT,
  duration     TEXT,
  status       TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'active', 'done')),
  points       INTEGER DEFAULT 10,
  ai_assisted  BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own tasks" ON tasks
  FOR ALL USING (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────
-- 6. PRODUCTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE products (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shop_id       UUID REFERENCES shops(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  buying_price  DECIMAL(10,2) DEFAULT 0,
  selling_price DECIMAL(10,2) NOT NULL,
  stock         INTEGER,
  category      TEXT,
  image_url     TEXT,
  supplier_url  TEXT,
  status        TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own products" ON products
  FOR ALL USING (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────
-- 7. CLIENTS (CRM)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE clients (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shop_id       UUID REFERENCES shops(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  phone         TEXT,
  email         TEXT,
  city          TEXT,
  total_orders  INTEGER DEFAULT 0,
  total_spent   DECIMAL(10,2) DEFAULT 0,
  last_order_at TIMESTAMPTZ,
  tags          TEXT[] DEFAULT '{}',
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own clients" ON clients
  FOR ALL USING (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────
-- 8. ORDERS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE orders (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shop_id          UUID REFERENCES shops(id) ON DELETE CASCADE,
  client_id        UUID REFERENCES clients(id) ON DELETE SET NULL,
  reference        TEXT UNIQUE,
  product_name     TEXT,
  amount           DECIMAL(10,2) NOT NULL,
  status           TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'returned', 'cancelled')),
  payment_method   TEXT DEFAULT 'cod' CHECK (payment_method IN ('cod', 'cmi', 'paydunya', 'virement')),
  delivery_company TEXT CHECK (delivery_company IN ('amana', 'chronopost', 'colis_prive', 'autre')),
  tracking_number  TEXT,
  city             TEXT,
  notes            TEXT,
  confirmed_at     TIMESTAMPTZ,
  shipped_at       TIMESTAMPTZ,
  delivered_at     TIMESTAMPTZ,
  returned_at      TIMESTAMPTZ,
  cancelled_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own orders" ON orders
  FOR ALL USING (auth.uid() = user_id);

-- Auto-génère la référence CMD-XXXXXX
CREATE OR REPLACE FUNCTION set_order_reference()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reference IS NULL THEN
    NEW.reference := 'CMD-' || UPPER(SUBSTRING(REPLACE(NEW.id::TEXT, '-', ''), 1, 6));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_order_insert
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE PROCEDURE set_order_reference();

-- Met à jour les timestamps selon les transitions de statut
CREATE OR REPLACE FUNCTION handle_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status THEN
    CASE NEW.status
      WHEN 'confirmed'  THEN NEW.confirmed_at  := NOW();
      WHEN 'shipped'    THEN NEW.shipped_at    := NOW();
      WHEN 'delivered'  THEN NEW.delivered_at  := NOW();
      WHEN 'returned'   THEN NEW.returned_at   := NOW();
      WHEN 'cancelled'  THEN NEW.cancelled_at  := NOW();
      ELSE NULL;
    END CASE;
    NEW.updated_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_order_status_change
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE PROCEDURE handle_order_status_change();


-- ─────────────────────────────────────────────────────────────
-- 9. ANALYTICS SNAPSHOTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE analytics_snapshots (
  id        UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id   UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shop_id   UUID REFERENCES shops(id) ON DELETE CASCADE,
  date      DATE NOT NULL,
  visitors  INTEGER DEFAULT 0,
  orders    INTEGER DEFAULT 0,
  revenue   DECIMAL(10,2) DEFAULT 0,
  ctr       DECIMAL(5,2),
  ad_spend  DECIMAL(10,2) DEFAULT 0,
  roas      DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

ALTER TABLE analytics_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own analytics" ON analytics_snapshots
  FOR ALL USING (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────
-- 10. AI USAGE (rate limiting)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE ai_usage (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  feature      TEXT NOT NULL,  -- 'chat' | 'plan_generation' | 'diagnostic' | 'content_gen' | 'product_desc'
  tokens_used  INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own ai usage" ON ai_usage
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ai usage" ON ai_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────
-- FONCTION : incrémenter stats client après commande
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_client_orders(
  p_client_id UUID,
  p_amount    DECIMAL
)
RETURNS VOID AS $$
BEGIN
  UPDATE clients
  SET
    total_orders  = total_orders + 1,
    total_spent   = total_spent + p_amount,
    last_order_at = NOW(),
    updated_at    = NOW()
  WHERE id = p_client_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─────────────────────────────────────────────────────────────
-- FONCTION : compter les appels IA aujourd'hui (rate limiting)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_daily_ai_calls(p_user_id UUID, p_feature TEXT)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM ai_usage
  WHERE user_id = p_user_id
    AND feature = p_feature
    AND created_at >= NOW() - INTERVAL '24 hours';
$$ LANGUAGE sql SECURITY DEFINER;


-- ─────────────────────────────────────────────────────────────
-- INDEX PERFORMANCE
-- ─────────────────────────────────────────────────────────────
-- Tasks
CREATE INDEX idx_tasks_plan_id     ON tasks(plan_id);
CREATE INDEX idx_tasks_user_id     ON tasks(user_id);
CREATE INDEX idx_tasks_status      ON tasks(user_id, status);
CREATE INDEX idx_tasks_week        ON tasks(plan_id, week_number);

-- Orders
CREATE INDEX idx_orders_user_id    ON orders(user_id);
CREATE INDEX idx_orders_client_id  ON orders(client_id);
CREATE INDEX idx_orders_status     ON orders(user_id, status);
CREATE INDEX idx_orders_created    ON orders(user_id, created_at DESC);
CREATE INDEX idx_orders_reference  ON orders(reference);

-- Clients
CREATE INDEX idx_clients_user_id   ON clients(user_id);
CREATE INDEX idx_clients_phone     ON clients(phone);

-- Products
CREATE INDEX idx_products_user_id  ON products(user_id);
CREATE INDEX idx_products_status   ON products(user_id, status);

-- Analytics
CREATE INDEX idx_analytics_user_date ON analytics_snapshots(user_id, date DESC);

-- AI usage
CREATE INDEX idx_ai_usage_user_feature ON ai_usage(user_id, feature, created_at DESC);

-- Plans
CREATE INDEX idx_plans_user_id ON plans(user_id);


-- ─────────────────────────────────────────────────────────────
-- INDEX FULL-TEXT (recherche clients et produits)
-- ─────────────────────────────────────────────────────────────
CREATE INDEX idx_clients_name_trgm   ON clients USING GIN (name gin_trgm_ops);
CREATE INDEX idx_clients_phone_trgm  ON clients USING GIN (phone gin_trgm_ops);
CREATE INDEX idx_products_name_trgm  ON products USING GIN (name gin_trgm_ops);
