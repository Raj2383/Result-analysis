-- ============================================================================
-- 001_init_schema.sql
-- ResultLens 12-Table PostgreSQL Schema (GGSIPU Ordinance 11)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROGRAMMES
CREATE TABLE IF NOT EXISTS programmes (
    prog_id             SERIAL PRIMARY KEY,
    prog_code           VARCHAR(10) NOT NULL UNIQUE,           -- e.g., '020'
    short_name          VARCHAR(30) NOT NULL,                  -- e.g., 'BCA'
    full_name           VARCHAR(150) NOT NULL,                 -- e.g., 'BACHELOR OF COMPUTER APPLICATIONS'
    duration_semesters  SMALLINT NOT NULL DEFAULT 6,
    ordinance_version   VARCHAR(30) NOT NULL DEFAULT 'Ordinance 11',
    min_pass_pct        NUMERIC(5,2) NOT NULL DEFAULT 40.00,   -- Ordinance 11 combined 40% pass mark
    min_internal_pct    NUMERIC(5,2) DEFAULT NULL,             -- Optional strict internal cutoff (null = disabled)
    min_external_pct    NUMERIC(5,2) DEFAULT NULL,             -- Optional strict external cutoff (null = disabled)
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. INSTITUTIONS (Preserves multi-shift GGSIPU institution codes)
CREATE TABLE IF NOT EXISTS institutions (
    inst_id             SERIAL PRIMARY KEY,
    inst_code           VARCHAR(10) NOT NULL UNIQUE,           -- e.g., '142', '214', '149', '212', '177', '298'
    inst_name           VARCHAR(200) NOT NULL,                 -- Official printed name on PDF
    canonical_name      VARCHAR(150) NOT NULL,                 -- Shift-independent name for groupBy=name (e.g., 'VIPS', 'MSI', 'JIMS Vasant Kunj')
    short_code          VARCHAR(30) NOT NULL,                  -- e.g., 'VIPS-I', 'VIPS-II', 'MSI-I', 'MSI-II'
    shift               SMALLINT NOT NULL DEFAULT 1 CHECK (shift IN (1, 2)),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. SCHEMES
CREATE TABLE IF NOT EXISTS schemes (
    scheme_id           VARCHAR(25) NOT NULL UNIQUE,          -- e.g., '19020202109', '19020201609'
    prog_id             INTEGER NOT NULL REFERENCES programmes(prog_id) ON DELETE RESTRICT,
    semester            SMALLINT NOT NULL CHECK (semester BETWEEN 1 AND 10),
    wef_batch_year      SMALLINT NOT NULL,                     -- e.g., 2021
    required_credits    SMALLINT NOT NULL DEFAULT 26,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. PAPERS
CREATE TABLE IF NOT EXISTS papers (
    paper_id            SERIAL PRIMARY KEY,
    paper_id_code       VARCHAR(15) NOT NULL,                  -- 5/6-digit Paper ID in brackets e.g., '020301', '020331'
    paper_code          VARCHAR(30) NOT NULL,                  -- Course code e.g., 'BCA 301', 'BCA 331'
    prog_id             INTEGER NOT NULL REFERENCES programmes(prog_id) ON DELETE RESTRICT,
    scheme_id           VARCHAR(25) REFERENCES schemes(scheme_id) ON DELETE SET NULL,
    semester            SMALLINT NOT NULL CHECK (semester BETWEEN 1 AND 10),
    title               VARCHAR(200) NOT NULL,
    credits             SMALLINT NOT NULL CHECK (credits >= 0),
    paper_type          VARCHAR(20) NOT NULL DEFAULT 'THEORY'
                        CHECK (paper_type IN ('THEORY', 'PRACTICAL', 'PROJECT', 'NUES', 'ELECTIVE')),
    exam_mode           VARCHAR(10) NOT NULL DEFAULT 'UES'
                        CHECK (exam_mode IN ('UES', 'NUES')),
    pass_marks          SMALLINT NOT NULL DEFAULT 40,
    max_internal        SMALLINT NOT NULL DEFAULT 25,
    max_external        SMALLINT NOT NULL DEFAULT 75,
    max_total           SMALLINT NOT NULL DEFAULT 100,
    is_mandatory        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (paper_id_code, semester)
);

-- 5. GRADE_SCALE (GGSIPU Ordinance 11 Lookup Table)
CREATE TABLE IF NOT EXISTS grade_scale (
    grade               VARCHAR(5) PRIMARY KEY,                -- 'O', 'A+', 'A', 'B+', 'B', 'C', 'P', 'F', 'AB', 'RL', 'D', 'CAN'
    grade_point         SMALLINT NOT NULL CHECK (grade_point BETWEEN 0 AND 10),
    min_marks           SMALLINT,                              -- NULL for status grades ('AB', 'RL', 'D')
    max_marks           SMALLINT,
    description         VARCHAR(50) NOT NULL,
    is_passing          BOOLEAN NOT NULL DEFAULT TRUE
);

-- 6. STUDENTS
CREATE TABLE IF NOT EXISTS students (
    roll_no             VARCHAR(15) PRIMARY KEY,               -- 11-digit GGSIPU Enrolment No e.g., '00911102022'
    name                VARCHAR(150) NOT NULL,
    sid                 VARCHAR(25) NOT NULL,                  -- e.g., '190000129612'
    scheme_code         VARCHAR(25) NOT NULL,                  -- e.g., '19020202109'
    prog_id             INTEGER NOT NULL REFERENCES programmes(prog_id) ON DELETE RESTRICT,
    inst_id             INTEGER NOT NULL REFERENCES institutions(inst_id) ON DELETE RESTRICT,
    class_serial_code   VARCHAR(5) NOT NULL,                   -- Digits 1..3 of roll_no
    inst_code_from_roll VARCHAR(5) NOT NULL,                   -- Digits 4..6 of roll_no
    prog_code_from_roll VARCHAR(5) NOT NULL,                   -- Digits 7..9 of roll_no
    batch_year          SMALLINT NOT NULL,                     -- Derived from last 2 digits (e.g., '22' -> 2022) or header Batch
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. UPLOADS
CREATE TABLE IF NOT EXISTS uploads (
    upload_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_filename   VARCHAR(255) NOT NULL,
    file_sha256         CHAR(64) NOT NULL UNIQUE,              -- Prevents duplicate ingestion unless force=true
    file_size_bytes     BIGINT NOT NULL,
    uploaded_by         INTEGER,                               -- References users(user_id)
    status              VARCHAR(20) NOT NULL DEFAULT 'PROCESSING'
                        CHECK (status IN ('PROCESSING', 'COMPLETED', 'FAILED')),
    total_pages         INTEGER NOT NULL DEFAULT 0,
    scheme_pages_count  INTEGER NOT NULL DEFAULT 0,
    result_pages_count  INTEGER NOT NULL DEFAULT 0,
    students_parsed     INTEGER NOT NULL DEFAULT 0,
    results_upserted    INTEGER NOT NULL DEFAULT 0,
    marks_upserted      INTEGER NOT NULL DEFAULT 0,
    parse_warnings      JSONB NOT NULL DEFAULT '[]'::jsonb,
    error_message       TEXT,
    started_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at        TIMESTAMPTZ
);

-- 8. EXAMS
CREATE TABLE IF NOT EXISTS exams (
    exam_id             SERIAL PRIMARY KEY,
    upload_id           UUID NOT NULL REFERENCES uploads(upload_id) ON DELETE CASCADE,
    prog_id             INTEGER NOT NULL REFERENCES programmes(prog_id) ON DELETE RESTRICT,
    semester            SMALLINT NOT NULL CHECK (semester BETWEEN 1 AND 10),
    exam_session        VARCHAR(50) NOT NULL,                  -- e.g., 'DEC 2024 - JAN 2025'
    exam_category       VARCHAR(20) NOT NULL                   -- 'REGULAR' or 'REAPPEAR'
                        CHECK (exam_category IN ('REGULAR', 'REAPPEAR', 'SUPPLEMENTARY')),
    batch_year          SMALLINT NOT NULL,                     -- e.g., 2022, 2021, 2020
    rtsid               VARCHAR(35),                           -- e.g., '2025022602020221420005'
    declared_date       DATE,                                  -- Parsed from RTSID prefix YYYYMMDD (2025-02-26)
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (prog_id, semester, exam_session, exam_category, batch_year)
);

-- 9. STUDENT_RESULTS (One row per student block printed in an exam session)
CREATE TABLE IF NOT EXISTS student_results (
    result_id           BIGSERIAL PRIMARY KEY,
    student_roll_no     VARCHAR(15) NOT NULL REFERENCES students(roll_no) ON DELETE CASCADE,
    exam_id             INTEGER NOT NULL REFERENCES exams(exam_id) ON DELETE CASCADE,
    upload_id           UUID NOT NULL REFERENCES uploads(upload_id) ON DELETE CASCADE,
    inst_id             INTEGER NOT NULL REFERENCES institutions(inst_id) ON DELETE RESTRICT,
    semester            SMALLINT NOT NULL,
    exam_category       VARCHAR(20) NOT NULL CHECK (exam_category IN ('REGULAR', 'REAPPEAR', 'SUPPLEMENTARY')),
    batch_year          SMALLINT NOT NULL,
    credits_secured     SMALLINT NOT NULL DEFAULT 0,           -- Parsed from CS/Remarks column
    remarks_raw         VARCHAR(255),                          -- e.g., '26', '22', 'RL', 'Detained', 'Cancelled'
    result_status       VARCHAR(25) NOT NULL DEFAULT 'PASS'
                        CHECK (result_status IN ('PASS', 'PROMOTED', 'FAIL', 'RL', 'DETAINED', 'CANCELLED')),
    pdf_page_number     INTEGER NOT NULL,
    row_serial_number   INTEGER,                               -- S.No. on tabulation sheet (1..180)
    attempt_timestamp   DATE NOT NULL DEFAULT CURRENT_DATE,
    is_latest_attempt   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (student_roll_no, exam_id, pdf_page_number)
);

-- 10. MARKS (Individual subject/paper lines inside a student result block)
CREATE TABLE IF NOT EXISTS marks (
    mark_id             BIGSERIAL PRIMARY KEY,
    result_id           BIGINT NOT NULL REFERENCES student_results(result_id) ON DELETE CASCADE,
    student_roll_no     VARCHAR(15) NOT NULL REFERENCES students(roll_no) ON DELETE CASCADE,
    paper_id            INTEGER REFERENCES papers(paper_id) ON DELETE SET NULL,
    paper_id_code       VARCHAR(15) NOT NULL,                  -- e.g., '020301'
    semester            SMALLINT NOT NULL,
    credits             SMALLINT NOT NULL CHECK (credits >= 0),
    internal_raw        VARCHAR(15) NOT NULL,                  -- Exact token: '15', '0', 'A', '-', 'RL', 'D'
    external_raw        VARCHAR(15) NOT NULL,                  -- Exact token: '21', '0', '44', '-', 'A'
    total_grade_raw     VARCHAR(25) NOT NULL,                  -- Exact token: '40(P)*', '90(O)', 'A(F)', '16(F)', 'RL'
    internal_score      SMALLINT,                              -- NULL for '-', 'A', 'RL', 'D', 'C'
    external_score      SMALLINT,                              -- NULL for '-', 'A', 'RL', 'D', 'C'
    computed_sum        SMALLINT,                              -- internal_score + external_score before grace
    total_score         SMALLINT,                              -- Official printed total (includes grace if *)
    grade               VARCHAR(5) NOT NULL REFERENCES grade_scale(grade),
    grade_point         SMALLINT NOT NULL CHECK (grade_point BETWEEN 0 AND 10),
    credit_points       INTEGER NOT NULL DEFAULT 0,            -- credits * grade_point
    is_grace            BOOLEAN NOT NULL DEFAULT FALSE,        -- TRUE when '*' present in total_grade_raw
    grace_amount        SMALLINT NOT NULL DEFAULT 0,           -- total_score - (internal_score + external_score)
    is_absent_internal  BOOLEAN NOT NULL DEFAULT FALSE,        -- TRUE when internal_raw = 'A'
    is_absent_external  BOOLEAN NOT NULL DEFAULT FALSE,        -- TRUE when external_raw = 'A'
    is_nues_dash        BOOLEAN NOT NULL DEFAULT FALSE,        -- TRUE when internal_raw = '-' or external_raw = '-'
    is_passed           BOOLEAN NOT NULL DEFAULT FALSE,
    paper_status        VARCHAR(20) NOT NULL DEFAULT 'PASS'
                        CHECK (paper_status IN ('PASS', 'GRACE_PASS', 'FAIL', 'ABSENT', 'RL', 'DETAINED', 'CANCELLED', 'ALREADY_PASSED')),
    is_effective_latest BOOLEAN NOT NULL DEFAULT TRUE,         -- TRUE for latest attempt per (student_roll_no, paper_id_code)
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (result_id, paper_id_code)
);

-- 11. SEMESTER_SUMMARY (Materialized/Upserted per student & semester after effective-latest resolution)
CREATE TABLE IF NOT EXISTS semester_summary (
    summary_id          BIGSERIAL PRIMARY KEY,
    student_roll_no     VARCHAR(15) NOT NULL REFERENCES students(roll_no) ON DELETE CASCADE,
    semester            SMALLINT NOT NULL CHECK (semester BETWEEN 1 AND 10),
    latest_result_id    BIGINT NOT NULL REFERENCES student_results(result_id) ON DELETE CASCADE,
    inst_id             INTEGER NOT NULL REFERENCES institutions(inst_id) ON DELETE RESTRICT,
    batch_year          SMALLINT NOT NULL,
    exam_category       VARCHAR(20) NOT NULL,                  -- 'REGULAR' or 'REAPPEAR'
    papers_appeared     SMALLINT NOT NULL DEFAULT 0,
    papers_passed       SMALLINT NOT NULL DEFAULT 0,
    backlog_count       SMALLINT NOT NULL DEFAULT 0,
    grace_papers_count  SMALLINT NOT NULL DEFAULT 0,
    total_grace_marks   SMALLINT NOT NULL DEFAULT 0,
    total_marks_obt     INTEGER NOT NULL DEFAULT 0,
    max_total_marks     INTEGER NOT NULL DEFAULT 0,
    percentage          NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    credits_registered  SMALLINT NOT NULL DEFAULT 0,
    credits_earned      SMALLINT NOT NULL DEFAULT 0,
    total_credit_points INTEGER NOT NULL DEFAULT 0,
    sgpa                NUMERIC(4,2) NOT NULL DEFAULT 0.00,    -- SUM(Ci * Gi) / SUM(Ci)
    cgpa                NUMERIC(4,2) NOT NULL DEFAULT 0.00,    -- Cumulative across all available semesters
    overall_status      VARCHAR(25) NOT NULL DEFAULT 'PASS'
                        CHECK (overall_status IN ('PASS', 'PROMOTED', 'FAIL', 'RL', 'DETAINED', 'CANCELLED')),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (student_roll_no, semester)
);

-- 12. USERS (Supports Faculty, Admin, and optional Student accounts from ResultLens.html auth modal)
CREATE TABLE IF NOT EXISTS users (
    user_id             SERIAL PRIMARY KEY,
    full_name           VARCHAR(120) NOT NULL,
    email               VARCHAR(150) NOT NULL UNIQUE,
    password_hash        VARCHAR(255) NOT NULL,
    role                VARCHAR(20) NOT NULL DEFAULT 'FACULTY'
                        CHECK (role IN ('ADMIN', 'FACULTY', 'STUDENT')),
    inst_id             INTEGER REFERENCES institutions(inst_id) ON DELETE SET NULL,
    student_roll_no     VARCHAR(15) REFERENCES students(roll_no) ON DELETE SET NULL,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at       TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
