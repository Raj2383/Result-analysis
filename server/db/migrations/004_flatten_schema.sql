-- ============================================================================
-- 004_flatten_schema.sql
-- Drops the original heavily-normalised schema and replaces it with the
-- flat schema that the application repositories actually use.
-- ============================================================================

-- ── Drop old tables (reverse FK order) ──────────────────────────────────────
DROP TABLE IF EXISTS marks             CASCADE;
DROP TABLE IF EXISTS semester_summary  CASCADE;
DROP TABLE IF EXISTS student_results   CASCADE;
DROP TABLE IF EXISTS exams             CASCADE;
DROP TABLE IF EXISTS uploads           CASCADE;
DROP TABLE IF EXISTS students          CASCADE;
DROP TABLE IF EXISTS papers            CASCADE;
DROP TABLE IF EXISTS schemes           CASCADE;
DROP TABLE IF EXISTS programmes        CASCADE;
DROP TABLE IF EXISTS institutions      CASCADE;
DROP TABLE IF EXISTS grade_scale       CASCADE;
DROP TABLE IF EXISTS users             CASCADE;

-- ── 1. GRADE_SCALE ───────────────────────────────────────────────────────────
CREATE TABLE grade_scale (
    grade        VARCHAR(5)  PRIMARY KEY,
    min_marks    SMALLINT,
    max_marks    SMALLINT,
    grade_point  SMALLINT    NOT NULL CHECK (grade_point BETWEEN 0 AND 10),
    description  VARCHAR(50) NOT NULL,
    is_passing   BOOLEAN     NOT NULL DEFAULT TRUE
);

-- ── 2. INSTITUTIONS ──────────────────────────────────────────────────────────
CREATE TABLE institutions (
    code  VARCHAR(10)  PRIMARY KEY,
    name  VARCHAR(200) NOT NULL
);

-- ── 3. PROGRAMMES ────────────────────────────────────────────────────────────
CREATE TABLE programmes (
    code  VARCHAR(10)  PRIMARY KEY,
    name  VARCHAR(150)
);

-- ── 4. SCHEMES ───────────────────────────────────────────────────────────────
CREATE TABLE schemes (
    scheme_id        VARCHAR(25) PRIMARY KEY,
    institution_code VARCHAR(10) REFERENCES institutions(code) ON DELETE SET NULL,
    programme_code   VARCHAR(10) REFERENCES programmes(code)   ON DELETE SET NULL,
    semester         SMALLINT
);

-- ── 5. PAPERS ────────────────────────────────────────────────────────────────
CREATE TABLE papers (
    id          SERIAL      PRIMARY KEY,
    scheme_id   VARCHAR(25) NOT NULL REFERENCES schemes(scheme_id) ON DELETE CASCADE,
    paper_id    VARCHAR(15) NOT NULL,
    code        VARCHAR(30),
    name        VARCHAR(200),
    credits     SMALLINT    NOT NULL DEFAULT 0,
    paper_type  VARCHAR(20),
    exam_mode   VARCHAR(10),
    kind        VARCHAR(20),
    minor_max   SMALLINT,
    major_max   SMALLINT,
    max_marks   SMALLINT,
    pass_marks  SMALLINT,
    UNIQUE (scheme_id, paper_id)
);

-- ── 6. STUDENTS ──────────────────────────────────────────────────────────────
CREATE TABLE students (
    roll_no          VARCHAR(15) PRIMARY KEY,
    name             VARCHAR(150) NOT NULL,
    sid              VARCHAR(25),
    institution_code VARCHAR(10)  REFERENCES institutions(code) ON DELETE SET NULL,
    programme_code   VARCHAR(10)  REFERENCES programmes(code)   ON DELETE SET NULL,
    batch            SMALLINT,
    scheme_id        VARCHAR(25)  REFERENCES schemes(scheme_id) ON DELETE SET NULL
);

-- ── 7. UPLOADS ───────────────────────────────────────────────────────────────
CREATE TABLE uploads (
    id          SERIAL       PRIMARY KEY,
    file_hash   CHAR(64)     NOT NULL UNIQUE,
    filename    VARCHAR(255) NOT NULL,
    uploaded_by INTEGER,                     -- references users(id) loosely
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── 8. EXAMS ─────────────────────────────────────────────────────────────────
CREATE TABLE exams (
    id         SERIAL       PRIMARY KEY,
    batch      SMALLINT     NOT NULL,
    session    VARCHAR(60)  NOT NULL DEFAULT '',
    exam_type  VARCHAR(20)  NOT NULL,
    semester   SMALLINT     NOT NULL,
    upload_id  INTEGER      REFERENCES uploads(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (batch, session, exam_type, semester)
);

-- ── 9. STUDENT_RESULTS ───────────────────────────────────────────────────────
CREATE TABLE student_results (
    id              BIGSERIAL   PRIMARY KEY,
    exam_id         INTEGER     NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    roll_no         VARCHAR(15) NOT NULL REFERENCES students(roll_no) ON DELETE CASCADE,
    exam_type       VARCHAR(20) NOT NULL,
    credits_secured SMALLINT    NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (exam_id, roll_no)
);

-- ── 10. MARKS ────────────────────────────────────────────────────────────────
CREATE TABLE marks (
    id        BIGSERIAL PRIMARY KEY,
    result_id BIGINT    NOT NULL REFERENCES student_results(id) ON DELETE CASCADE,
    paper_pk  INTEGER   NOT NULL REFERENCES papers(id)          ON DELETE CASCADE,
    internal  SMALLINT,
    external  SMALLINT,
    total     SMALLINT,
    grade     VARCHAR(5),
    is_absent BOOLEAN   NOT NULL DEFAULT FALSE,
    is_grace  BOOLEAN   NOT NULL DEFAULT FALSE,
    UNIQUE (result_id, paper_pk)
);

-- ── 11. SEMESTER_SUMMARY ─────────────────────────────────────────────────────
CREATE TABLE semester_summary (
    roll_no          VARCHAR(15) NOT NULL REFERENCES students(roll_no) ON DELETE CASCADE,
    semester         SMALLINT    NOT NULL,
    sgpa             NUMERIC(5,2) NOT NULL DEFAULT 0,
    cgpa             NUMERIC(5,2) NOT NULL DEFAULT 0,
    total_credits    SMALLINT     NOT NULL DEFAULT 0,
    has_backlog      BOOLEAN      NOT NULL DEFAULT FALSE,
    college_rank     INTEGER,
    university_rank  INTEGER,
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    PRIMARY KEY (roll_no, semester)
);

-- ── 12. USERS ────────────────────────────────────────────────────────────────
CREATE TABLE users (
    id            SERIAL       PRIMARY KEY,
    role          VARCHAR(20)  NOT NULL DEFAULT 'faculty'
                               CHECK (role IN ('admin', 'faculty')),
    username      VARCHAR(50)  UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name          VARCHAR(150),
    full_name     VARCHAR(150),
    email         VARCHAR(150),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
