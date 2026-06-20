-- RUN THIS IN SUPABASE SQL EDITOR (https://supabase.com/dashboard/project/tufltrankwmsxbuljosq/sql/new)
-- Creates tables for feed, squads, and support tickets

-- 1. FEED ACTIVITIES (public activity feed)
CREATE TABLE IF NOT EXISTS feed_activities (
  id TEXT PRIMARY KEY,
  action_type TEXT NOT NULL,
  message TEXT NOT NULL,
  username TEXT NOT NULL,
  rank TEXT DEFAULT 'E',
  timestamp BIGINT NOT NULL,
  squad_id TEXT,
  task_title TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fetching feed sorted by timestamp
CREATE INDEX IF NOT EXISTS idx_feed_timestamp ON feed_activities (timestamp DESC);

-- 2. SQUADS (teams)
CREATE TABLE IF NOT EXISTS squads (
  id TEXT PRIMARY KEY,
  squad_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for searching squads
CREATE INDEX IF NOT EXISTS idx_squads_data ON squads USING GIN (squad_data);

-- 3. SUPPORT TICKETS
CREATE TABLE IF NOT EXISTS support_tickets (
  id TEXT PRIMARY KEY,
  ticket_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for searching tickets by user
CREATE INDEX IF NOT EXISTS idx_tickets_data ON support_tickets USING GIN (ticket_data);

-- 4. ADD RLS POLICIES (allow public access for now - matches existing tables)
ALTER TABLE feed_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Public access policies (matching existing table patterns)
CREATE POLICY "Public insert feed" ON feed_activities FOR INSERT WITH CHECK (true);
CREATE POLICY "Public select feed" ON feed_activities FOR SELECT USING (true);
CREATE POLICY "Public delete feed" ON feed_activities FOR DELETE USING (true);

CREATE POLICY "Public insert squads" ON squads FOR INSERT WITH CHECK (true);
CREATE POLICY "Public select squads" ON squads FOR SELECT USING (true);
CREATE POLICY "Public update squads" ON squads FOR UPDATE USING (true);
CREATE POLICY "Public delete squads" ON squads FOR DELETE USING (true);

CREATE POLICY "Public insert tickets" ON support_tickets FOR INSERT WITH CHECK (true);
CREATE POLICY "Public select tickets" ON support_tickets FOR SELECT USING (true);
CREATE POLICY "Public update tickets" ON support_tickets FOR UPDATE USING (true);
CREATE POLICY "Public delete tickets" ON support_tickets FOR DELETE USING (true);
