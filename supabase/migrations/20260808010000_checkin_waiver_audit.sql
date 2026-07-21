-- =============================================================================
-- Legal-audit fields for the check-in waiver signature (Lei 14.063/2020,
-- MP 2.200-2 — digital-signature evidentiary requirements). ip_address,
-- user_agent and waiver_signed_at already exist on this table; this adds
-- the piece that was missing: a tamper-evident record of exactly WHAT was
-- signed, not just that something was.
--
-- waiver_content_snapshot stores the literal text shown (text-mode) or the
-- document URL (file-mode) at the moment of signing — kept per-checkin
-- because schools.waiver_pt/en/fr/es or the uploaded file can be edited
-- later, which would otherwise silently invalidate old audit trails.
-- waiver_version_hash is the SHA-256 of that exact content (the file's
-- bytes for file-mode, not just its URL), computed server-side in
-- api/checkin/route.ts. waiver_source_type records which resolution path
-- (text vs file) produced the snapshot, so it can be redisplayed correctly
-- by api/owner/checkin-waiver/[checkinId].
-- =============================================================================

ALTER TABLE public.checkins
  ADD COLUMN IF NOT EXISTS waiver_content_snapshot TEXT,
  ADD COLUMN IF NOT EXISTS waiver_version_hash TEXT,
  ADD COLUMN IF NOT EXISTS waiver_source_type TEXT;
