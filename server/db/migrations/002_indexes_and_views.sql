-- ============================================================================
-- 002_indexes_and_views.sql
-- ResultLens – indexes and views
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_students_inst_batch ON students(inst_id, batch_year);
CREATE INDEX IF NOT EXISTS idx_students_name_trgm ON students(LOWER(name));
CREATE INDEX IF NOT EXISTS idx_student_results_roll_sem ON student_results(student_roll_no, semester);
CREATE INDEX IF NOT EXISTS idx_marks_roll_paper_latest ON marks(student_roll_no, paper_id_code, is_effective_latest);
CREATE INDEX IF NOT EXISTS idx_marks_paper_effective ON marks(paper_id_code, is_effective_latest, total_score DESC);
CREATE INDEX IF NOT EXISTS idx_sem_summary_sgpa_desc ON semester_summary(semester, batch_year, sgpa DESC, percentage DESC);
CREATE INDEX IF NOT EXISTS idx_sem_summary_inst_sgpa ON semester_summary(inst_id, semester, sgpa DESC);
CREATE INDEX IF NOT EXISTS idx_institutions_canonical ON institutions(canonical_name);

-- Views are added in later phases once report endpoints land; reserved here per spec.
-- CREATE OR REPLACE VIEW v_resultlens_overview AS
-- SELECT 1 AS placeholder;
