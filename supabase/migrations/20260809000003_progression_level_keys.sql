-- Renames the student_progression / students.skill_level vocabulary to the
-- IKO/VDWS-style international keys (level_1_discovery / level_2_intermediate
-- / level_3_independent), replacing the old beginner/intermediate/advanced
-- values. Data-only — neither column has a CHECK constraint (both are free
-- text), so no ALTER TABLE is needed, just remapping existing rows.
--
-- Deliberately does NOT touch sessions.level / scheduled_lessons.level —
-- that's a separate, CHECK-constrained 4-value vocabulary
-- (experimental/iniciante/intermediario/avancado) tied to the "Aula
-- Experimental" gating logic, kept intentionally independent.

UPDATE public.student_progression SET level = 'level_1_discovery'    WHERE level = 'beginner';
UPDATE public.student_progression SET level = 'level_2_intermediate' WHERE level = 'intermediate';
UPDATE public.student_progression SET level = 'level_3_independent'  WHERE level = 'advanced';

UPDATE public.students SET skill_level = 'level_1_discovery'    WHERE skill_level = 'beginner';
UPDATE public.students SET skill_level = 'level_2_intermediate' WHERE skill_level = 'intermediate';
UPDATE public.students SET skill_level = 'level_3_independent'  WHERE skill_level = 'advanced';
