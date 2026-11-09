-- ============================================================================
-- 005_courses_and_academic_years.sql
-- Enriches programmes (courses) with short_name, degree_level, and metadata.
-- Enriches exams with exam_year, academic_year, and programme_code.
-- Adds indexes for fast course, year, and semester filtering.
-- ============================================================================

-- 1. Programmes enrichment
ALTER TABLE programmes
  ADD COLUMN IF NOT EXISTS short_name VARCHAR(50),
  ADD COLUMN IF NOT EXISTS degree_level VARCHAR(50) DEFAULT 'UG',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Upsert known GGSIPU programmes with human-readable names and short codes
INSERT INTO programmes (code, name, short_name, degree_level)
VALUES
  ('020', 'Bachelor of Computer Applications', 'BCA', 'UG'),
  ('044', 'Master of Computer Applications', 'MCA', 'PG'),
  ('027', 'B.Tech (Computer Science & Engineering)', 'B.Tech CSE', 'UG'),
  ('028', 'B.Tech (Electronics & Communication Engineering)', 'B.Tech ECE', 'UG'),
  ('031', 'Bachelor of Commerce (Honours)', 'B.Com (Hons)', 'UG'),
  ('017', 'Bachelor of Business Administration', 'BBA', 'UG'),
  ('040', 'B.A. LL.B. (Honours)', 'BA LLB', 'UG'),
  ('088', 'B.Tech (Artificial Intelligence & Data Science)', 'B.Tech AI-DS', 'UG')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  short_name = EXCLUDED.short_name,
  degree_level = EXCLUDED.degree_level;

-- Ensure any existing programmes have non-null short_name
UPDATE programmes
SET short_name = COALESCE(short_name, name, code)
WHERE short_name IS NULL;

-- 2. Exams enrichment
ALTER TABLE exams
  ADD COLUMN IF NOT EXISTS exam_year SMALLINT,
  ADD COLUMN IF NOT EXISTS academic_year VARCHAR(20),
  ADD COLUMN IF NOT EXISTS programme_code VARCHAR(10) REFERENCES programmes(code) ON DELETE SET NULL;

-- Backfill exam_year and academic_year from session where possible
UPDATE exams
SET exam_year = COALESCE(
  exam_year,
  NULLIF(substring(session from '\y(20\d{2})\y'), '')::smallint,
  (CASE WHEN batch >= 2000 THEN batch ELSE (2000 + batch) END)::smallint
)
WHERE exam_year IS NULL;

UPDATE exams
SET academic_year = COALESCE(
  academic_year,
  CASE
    WHEN exam_year IS NOT NULL THEN concat(exam_year, '-', exam_year + 1)
    ELSE NULL
  END
)
WHERE academic_year IS NULL;

-- Backfill exams.programme_code from students linked via student_results
UPDATE exams e
SET programme_code = sub.programme_code
FROM (
  SELECT sr.exam_id, st.programme_code
  FROM student_results sr
  JOIN students st ON st.roll_no = sr.roll_no
  WHERE st.programme_code IS NOT NULL
  GROUP BY sr.exam_id, st.programme_code
) sub
WHERE e.id = sub.exam_id AND e.programme_code IS NULL;

-- 3. Indexes for fast course/year/semester filtering
CREATE INDEX IF NOT EXISTS idx_students_programme_code ON students(programme_code);
CREATE INDEX IF NOT EXISTS idx_students_batch ON students(batch);
CREATE INDEX IF NOT EXISTS idx_students_prog_batch ON students(programme_code, batch);
CREATE INDEX IF NOT EXISTS idx_exams_filter ON exams(programme_code, batch, semester, exam_year);
CREATE INDEX IF NOT EXISTS idx_semester_summary_semester ON semester_summary(semester);
