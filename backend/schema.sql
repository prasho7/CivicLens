-- ============================================================================
-- CivicLens Database Schema for Supabase PostgreSQL
-- ============================================================================
-- Preserves the explicit distinction between:
-- 1. INCIDENTS: Clustered/triaged civic operational issues (e.g. CIV-8402)
-- 2. REPORTS: Individual citizen submissions/complaints (e.g. SUB-D82A4F, REP-101)
-- ============================================================================

-- Enable pgcrypto / uuid generator extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. INCIDENTS TABLE
-- Clustered civic problems managed by municipal operations
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS incidents (
    id VARCHAR(50) PRIMARY KEY,                  -- e.g. 'CIV-8402'
    incident_number VARCHAR(10) NOT NULL,        -- e.g. '01'
    category VARCHAR(100) NOT NULL,              -- e.g. 'Road Safety', 'Waste Management'
    category_theme VARCHAR(50) NOT NULL DEFAULT 'roads', -- 'roads', 'waste', 'lighting', 'water'
    title VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    priority VARCHAR(50) NOT NULL DEFAULT 'Medium', -- 'Critical', 'High', 'Medium', 'Low'
    priority_level VARCHAR(50) NOT NULL DEFAULT 'medium',
    status VARCHAR(50) NOT NULL DEFAULT 'Open',  -- 'Open', 'Under Review', 'Resolved'
    status_level VARCHAR(50) NOT NULL DEFAULT 'open',
    assigned_to VARCHAR(255),                    -- NULL if unassigned
    is_urgent BOOLEAN NOT NULL DEFAULT FALSE,
    zone VARCHAR(255),
    intake_window VARCHAR(255),
    cluster_pattern TEXT,
    evidence_risk_tag VARCHAR(100),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    updates JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. REPORTS TABLE
-- Individual citizen reports. Unlinked reports have incident_id = NULL.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ref_id VARCHAR(50) UNIQUE NOT NULL,          -- e.g. 'SUB-A1B2C3' or 'REP-101'
    incident_id VARCHAR(50) REFERENCES incidents(id) ON DELETE SET NULL, -- NULL for unlinked submissions
    category VARCHAR(100) NOT NULL,              -- 'Waterlogging', 'Roads', 'Waste', 'Streetlights', 'Drainage'
    category_theme VARCHAR(50) NOT NULL DEFAULT 'roads',
    description TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    channel VARCHAR(100) NOT NULL DEFAULT 'Citizen Web Portal',
    status VARCHAR(50) NOT NULL DEFAULT 'Submitted',
    status_level VARCHAR(50) NOT NULL DEFAULT 'submitted',
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_priority_evidence BOOLEAN NOT NULL DEFAULT FALSE,
    has_image BOOLEAN NOT NULL DEFAULT FALSE,
    image_url TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    analysis JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_reports_ref_id ON reports(ref_id);
CREATE INDEX IF NOT EXISTS idx_reports_incident_id ON reports(incident_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_priority ON incidents(priority);

-- ----------------------------------------------------------------------------
-- Row-Level Security (RLS) Configuration
-- ----------------------------------------------------------------------------
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for dashboard & tracking pages)
CREATE POLICY "Allow public read access to incidents" ON incidents
    FOR SELECT USING (true);

-- Allow public update to incidents (for officer workflow)
CREATE POLICY "Allow public update to incidents" ON incidents
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access to reports" ON reports
    FOR SELECT USING (true);

-- Allow public report creation (citizen submission)
CREATE POLICY "Allow public insert to reports" ON reports
    FOR INSERT WITH CHECK (true);

-- Allow public report update (for analysis enrichment)
CREATE POLICY "Allow public update to reports" ON reports
    FOR UPDATE USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- SEED DATA (Optional): Baseline 6 incidents and 10 linked reports
-- ----------------------------------------------------------------------------
INSERT INTO incidents (
    id, incident_number, category, category_theme, title, location,
    priority, priority_level, status, status_level, assigned_to,
    is_urgent, zone, intake_window, cluster_pattern, evidence_risk_tag
) VALUES
(
    'CIV-8402', '01', 'Road Safety', 'roads',
    'Dangerous pothole near school crossing', 'MG Road, Bengaluru',
    'Critical', 'critical', 'Open', 'open', 'Road Safety Response Unit 4',
    true, 'Ward 112 (East Zone), Bengaluru Urban', 'First logged at 07:15 AM · Last report 08:42 AM',
    'Corridor adjacent to primary school crossing', 'High Pedestrian Risk'
),
(
    'CIV-8397', '02', 'Waste Management', 'waste',
    'Garbage accumulation near residential blocks', 'Indiranagar, Bengaluru',
    'High', 'high', 'Under Review', 'review', 'Sanitation Wing B',
    false, 'Ward 84 (East Zone), Bengaluru Urban', 'First logged at 09:20 AM · Last report 11:05 AM',
    'Side-street residential intersection', 'Sanitation & Health Risk'
),
(
    'CIV-8391', '03', 'Street Lighting', 'lighting',
    'Streetlights not functioning after sunset', 'Jayanagar, Bengaluru',
    'Medium', 'medium', 'Open', 'open', NULL,
    false, 'Ward 153 (South Zone), Bengaluru Urban', 'First logged at 06:45 PM · Last report 08:10 PM',
    'Residential street grid (5 poles affected)', 'Low-Light Pedestrian Hazard'
),
(
    'CIV-8384', '04', 'Water Supply', 'water',
    'Water main leakage flooding pedestrian walkway', 'Koramangala, Bengaluru',
    'Critical', 'critical', 'Open', 'open', NULL,
    true, 'Ward 151 (South Zone), Bengaluru Urban', 'First logged at 06:10 AM · Last report 07:50 AM',
    'Commercial arterial corridor and sidewalk', 'Infrastructure Erosion Hazard'
),
(
    'CIV-8378', '05', 'Road Safety', 'roads',
    'Damaged storm drain grate creating hazard', 'Whitefield, Bengaluru',
    'High', 'high', 'Resolved', 'resolved', 'Stormwater Ops Team',
    false, 'Ward 85 (Mahadevapura Zone), Bengaluru Urban', 'First logged yesterday · Resolved today 10:30 AM',
    'Intersection stormwater runoff channel', 'Resolved Community Issue'
),
(
    'CIV-8362', '06', 'Road Safety', 'roads',
    'Fallen tree branch blocking transit lane', 'Malleshwaram, Bengaluru',
    'Medium', 'medium', 'Resolved', 'resolved', 'Urban Forestry Team',
    false, 'Ward 45 (West Zone), Bengaluru Urban', 'First logged yesterday · Cleared today 09:15 AM',
    'Bus rapid transit feeder corridor', 'Resolved Community Issue'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO reports (
    ref_id, incident_id, category, category_theme, description, location,
    channel, status, status_level, verified, is_priority_evidence
) VALUES
('REP-101', 'CIV-8402', 'Road Safety', 'roads', 'Vehicles are swerving into the opposite lane to avoid the pothole near the school gate.', 'MG Road, Bengaluru', 'Citizen Mobile App', 'Submitted', 'submitted', true, true),
('REP-102', 'CIV-8402', 'Road Safety', 'roads', 'School bus had to brake abruptly this morning to avoid wheel damage near the crossing.', 'MG Road, Bengaluru', 'Citizen Mobile App', 'Submitted', 'submitted', true, false),
('REP-103', 'CIV-8397', 'Waste Management', 'waste', 'Waste has been overflowing across the sidewalk for three days, attracting stray animals.', 'Indiranagar, Bengaluru', 'Web Portal', 'Submitted', 'submitted', true, true),
('REP-104', 'CIV-8397', 'Waste Management', 'waste', 'Foul smell reaching residential apartments; garbage bin is completely toppled.', 'Indiranagar, Bengaluru', 'Citizen Mobile App', 'Submitted', 'submitted', true, false),
('REP-105', 'CIV-8391', 'Street Lighting', 'lighting', 'Entire street stretch pitch dark after 7 PM, creating safety hazards for pedestrians.', 'Jayanagar, Bengaluru', 'Helpline Call', 'Submitted', 'submitted', true, true),
('REP-106', 'CIV-8384', 'Water Supply', 'water', 'High-pressure pipeline leak is eroding the footpath and entering adjacent basements.', 'Koramangala, Bengaluru', 'Citizen Mobile App', 'Submitted', 'submitted', true, true),
('REP-107', 'CIV-8384', 'Water Supply', 'water', 'Water flooding 100 meters of pedestrian walkway forcing people to walk into traffic.', 'Koramangala, Bengaluru', 'Web Portal', 'Submitted', 'submitted', true, false),
('REP-108', 'CIV-8378', 'Road Safety', 'roads', 'Drain grate has collapsed under vehicle weight, leaving a sharp 2-foot open cavity.', 'Whitefield, Bengaluru', 'Citizen Mobile App', 'Submitted', 'submitted', true, true),
('REP-109', 'CIV-8378', 'Road Safety', 'roads', 'Cyclist front wheel got caught in the damaged drain grate yesterday evening.', 'Whitefield, Bengaluru', 'Citizen Mobile App', 'Submitted', 'submitted', true, false),
('REP-110', 'CIV-8362', 'Road Safety', 'roads', 'Heavy branch snapped and obstruction blocking city bus transit lane completely.', 'Malleshwaram, Bengaluru', 'Municipal Radio', 'Submitted', 'submitted', true, true)
ON CONFLICT (ref_id) DO NOTHING;

