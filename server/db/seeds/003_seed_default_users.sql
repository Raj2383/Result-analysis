-- ============================================================================
-- 003_seed_default_users.sql
-- Default faculty/admin accounts. Password hashes are bcrypt (cost 10) of the
-- documented dev defaults and are refreshed by scripts/seed.ts on every run.
-- ============================================================================

INSERT INTO users (full_name, email, password_hash, role, inst_id, student_roll_no, is_active) VALUES
  ('Administrator', 'admin@resultlens.local', '$2a$10$tvHN.Yzq6IiwyShOWEZzS.9GOGK6wM5g.LxBdUWAIr0CA0f0DFFAy', 'ADMIN', NULL, NULL, TRUE),
  ('Seed Faculty', 'faculty@resultlens.local', '$2a$10$GH5RBBTz.yh8Snq./SoyJuXZQbj3iC4oiL0Xara6zbI0jj6h4wa0.', 'FACULTY', NULL, NULL, TRUE)
ON CONFLICT (email) DO NOTHING;
