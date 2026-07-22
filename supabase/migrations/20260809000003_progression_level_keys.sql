-- Renames the student_progression / students.skill_level vocabulary to the
-- IKO/VDWS-style international keys (level_1_discovery / level_2_intermediate
-- / level_3_independent), replacing the old beginner/intermediate/advanced
-- values.
--
-- Both columns are backed by the same Postgres enum, skill_level_enum
-- (confirmed via pg_type/pg_enum against production) — not free text, so
-- this uses ALTER TYPE ... RENAME VALUE instead of UPDATE. Renaming the
-- enum label relabels every existing row in every column using this type
-- in place, with no data rewrite. Guarded with pg_enum existence checks so
-- this is safe to re-run (e.g. if only some of the three renames applied).
--
-- Deliberately does NOT touch sessions.level / scheduled_lessons.level —
-- that's a separate, CHECK-constrained 4-value vocabulary
-- (experimental/iniciante/intermediario/avancado) tied to the "Aula
-- Experimental" gating logic, kept intentionally independent.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'skill_level_enum' AND e.enumlabel = 'beginner'
  ) THEN
    EXECUTE 'ALTER TYPE public.skill_level_enum RENAME VALUE ''beginner'' TO ''level_1_discovery''';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'skill_level_enum' AND e.enumlabel = 'intermediate'
  ) THEN
    EXECUTE 'ALTER TYPE public.skill_level_enum RENAME VALUE ''intermediate'' TO ''level_2_intermediate''';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'skill_level_enum' AND e.enumlabel = 'advanced'
  ) THEN
    EXECUTE 'ALTER TYPE public.skill_level_enum RENAME VALUE ''advanced'' TO ''level_3_independent''';
  END IF;
END $$;
