-- ============================================================================
-- PNP Assessment Tool — Initial Schema
-- ============================================================================

-- Program definitions (the canonical registry)
CREATE TABLE programs (
  id TEXT PRIMARY KEY,                    -- e.g. "bc-entrepreneur-base"
  province_code TEXT NOT NULL,
  province_name TEXT NOT NULL,
  stream_name TEXT NOT NULL,
  stream_slug TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('main','regional','graduate','farm','strategic')),
  status TEXT NOT NULL CHECK (status IN ('active','paused','closed','redesigning')),
  status_note TEXT,
  status_changed_at TIMESTAMPTZ,
  eoi_type TEXT NOT NULL,
  has_points_grid BOOLEAN DEFAULT FALSE,
  official_url TEXT NOT NULL,
  draw_page_url TEXT,
  last_verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Program rules (versioned JSON)
CREATE TABLE program_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id TEXT NOT NULL REFERENCES programs(id),
  version INTEGER NOT NULL,
  rules JSONB NOT NULL,
  effective_from TIMESTAMPTZ NOT NULL,
  effective_until TIMESTAMPTZ,
  change_summary TEXT,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (program_id, version)
);

-- Draw/invitation history
CREATE TABLE draws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id TEXT NOT NULL REFERENCES programs(id),
  draw_date DATE NOT NULL,
  invitations_issued INTEGER,
  min_score INTEGER,
  median_score INTEGER,
  max_score INTEGER,
  notes TEXT,
  source_url TEXT,
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (program_id, draw_date)
);

-- Pipeline run log
CREATE TABLE pipeline_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  province_code TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('running','success','partial','failed')),
  rules_hash TEXT,
  draws_hash TEXT,
  rules_changed BOOLEAN DEFAULT FALSE,
  draws_changed BOOLEAN DEFAULT FALSE,
  errors JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin review queue
CREATE TABLE review_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id TEXT NOT NULL REFERENCES programs(id),
  change_type TEXT NOT NULL CHECK (change_type IN ('rules','status','new_program')),
  old_value JSONB,
  new_value JSONB,
  diff_summary TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending','approved','rejected','auto_applied')) DEFAULT 'pending',
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Assessment sessions (anonymous)
CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT NOT NULL UNIQUE,
  email TEXT,
  answers JSONB NOT NULL,
  results JSONB,
  rules_snapshot_ids JSONB,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX idx_draws_program_date ON draws(program_id, draw_date DESC);
CREATE INDEX idx_program_rules_current ON program_rules(program_id) WHERE effective_until IS NULL;
CREATE INDEX idx_assessments_session ON assessments(session_token);
CREATE INDEX idx_assessments_email ON assessments(email) WHERE email IS NOT NULL;
CREATE INDEX idx_review_queue_pending ON review_queue(status) WHERE status = 'pending';

-- ============================================================================
-- Row Level Security
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

-- programs: public read, admin (service role) write
CREATE POLICY "programs_public_read"
  ON programs FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "programs_service_write"
  ON programs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- program_rules: public read, admin (service role) write
CREATE POLICY "program_rules_public_read"
  ON program_rules FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "program_rules_service_write"
  ON program_rules FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- draws: public read, admin (service role) write
CREATE POLICY "draws_public_read"
  ON draws FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "draws_service_write"
  ON draws FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- pipeline_runs: admin only (service role)
CREATE POLICY "pipeline_runs_service_only"
  ON pipeline_runs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- review_queue: admin only (service role)
CREATE POLICY "review_queue_service_only"
  ON review_queue FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- assessments: read/write by matching session token (via RPC or anon with token), or service role
CREATE POLICY "assessments_service_all"
  ON assessments FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "assessments_anon_select_by_token"
  ON assessments FOR SELECT
  TO anon, authenticated
  USING (
    session_token = current_setting('request.headers', true)::json->>'x-session-token'
  );

CREATE POLICY "assessments_anon_insert"
  ON assessments FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "assessments_anon_update_by_token"
  ON assessments FOR UPDATE
  TO anon, authenticated
  USING (
    session_token = current_setting('request.headers', true)::json->>'x-session-token'
  )
  WITH CHECK (
    session_token = current_setting('request.headers', true)::json->>'x-session-token'
  );
