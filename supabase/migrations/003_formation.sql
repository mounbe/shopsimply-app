-- ═══════════════════════════════════════════════════════════════
-- ShopSimply — Migration 003 : Module Formation
-- ═══════════════════════════════════════════════════════════════

-- ── PROGRESSION FORMATION ─────────────────────────────────────
CREATE TABLE formation_progress (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  module_slug TEXT NOT NULL,       -- ex: 'lancer-boutique'
  lesson_slug TEXT NOT NULL,       -- ex: 'choisir-niche'
  completed   BOOLEAN DEFAULT TRUE,
  score       INTEGER,             -- score quiz 0-100
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, module_slug, lesson_slug)
);

ALTER TABLE formation_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own formation progress" ON formation_progress
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_formation_user ON formation_progress(user_id, module_slug);


-- ── NOTES PERSONNELLES SUR LES MODULES ───────────────────────
CREATE TABLE formation_notes (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  module_slug TEXT NOT NULL,
  content     TEXT NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, module_slug)
);

ALTER TABLE formation_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own formation notes" ON formation_notes
  FOR ALL USING (auth.uid() = user_id);


-- ── FONCTION : POURCENTAGE COMPLÉTION PAR MODULE ─────────────
CREATE OR REPLACE FUNCTION get_module_completion(p_user_id UUID, p_module_slug TEXT, p_total_lessons INTEGER)
RETURNS INTEGER AS $$
  SELECT CASE
    WHEN p_total_lessons = 0 THEN 0
    ELSE ROUND(
      COUNT(*)::DECIMAL / p_total_lessons * 100
    )::INTEGER
  END
  FROM formation_progress
  WHERE user_id = p_user_id
    AND module_slug = p_module_slug
    AND completed = TRUE;
$$ LANGUAGE sql SECURITY DEFINER;
