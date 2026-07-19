-- Backfills package_sales.student_id where it's null and exactly one
-- students row in the same school matches the sale's free-typed
-- student_name (case/whitespace-insensitive). Purely additive: fills a
-- missing foreign key, never touches or merges any students row. Skips
-- ambiguous names (more than one student sharing the exact name in the
-- same school) rather than guessing wrong — those stay null for manual
-- review. See AUDITORIA_DASHBOARD.md item 4: this table's student_id was
-- left null by nearly every write path, which is why balance lookups have
-- had to fall back to free-text name matching everywhere.
UPDATE public.package_sales ps
SET student_id = s.id
FROM public.students s
WHERE ps.student_id IS NULL
  AND ps.school_id = s.school_id
  AND lower(trim(ps.student_name)) = lower(trim(s.name))
  AND (
    SELECT count(*) FROM public.students s2
    WHERE s2.school_id = ps.school_id
      AND lower(trim(s2.name)) = lower(trim(ps.student_name))
  ) = 1;
