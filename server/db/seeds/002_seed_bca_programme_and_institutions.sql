-- ============================================================================
-- 002_seed_bca_programme_and_institutions.sql
-- BCA programme + GGSIPU BCA institution catalogue (multi-shift canonical names)
-- ============================================================================

INSERT INTO programmes (prog_code, short_name, full_name, duration_semesters, ordinance_version, min_pass_pct, min_internal_pct, min_external_pct)
VALUES ('020', 'BCA', 'BACHELOR OF COMPUTER APPLICATIONS', 6, 'Ordinance 11', 40.00, NULL, NULL)
ON CONFLICT (prog_code) DO NOTHING;

INSERT INTO institutions (inst_code, inst_name, canonical_name, short_code, shift, is_active) VALUES
('142', 'JAGANNATH INTERNATIONAL MANAGEMENT SCHOOL, VASANT KUNJ (SHIFT I)', 'JIMS Vasant Kunj', 'JIMS-VK-I', 1, TRUE),
('214', 'JAGANNATH INTERNATIONAL MANAGEMENT SCHOOL, VASANT KUNJ (SHIFT II)', 'JIMS Vasant Kunj', 'JIMS-VK-II', 2, TRUE),
('149', 'MAHARAJA SURAJMAL INSTITUTE (SHIFT I)', 'Maharaja Surajmal Institute', 'MSI-I', 1, TRUE),
('212', 'MAHARAJA SURAJMAL INSTITUTE (SHIFT II)', 'Maharaja Surajmal Institute', 'MSI-II', 2, TRUE),
('177', 'VIVEKANANDA INSTITUTE OF PROFESSIONAL STUDIES (SHIFT I)', 'VIPS', 'VIPS-I', 1, TRUE),
('298', 'VIVEKANANDA INSTITUTE OF PROFESSIONAL STUDIES (SHIFT II)', 'VIPS', 'VIPS-II', 2, TRUE),
('137', 'INSTITUTE OF INFORMATION TECHNOLOGY & MANAGEMENT (SHIFT I)', 'IINTM Janakpuri', 'IINTM-I', 1, TRUE),
('211', 'INSTITUTE OF INFORMATION TECHNOLOGY & MANAGEMENT (SHIFT II)', 'IINTM Janakpuri', 'IINTM-II', 2, TRUE),
('140', 'JAGAN INSTITUTE OF MANAGEMENT STUDIES, ROHINI (SHIFT I)', 'JIMS Rohini', 'JIMS-ROH-I', 1, TRUE),
('207', 'JAGAN INSTITUTE OF MANAGEMENT STUDIES, ROHINI (SHIFT II)', 'JIMS Rohini', 'JIMS-ROH-II', 2, TRUE),
('151', 'TRINITY INSTITUTE OF PROFESSIONAL STUDIES (SHIFT I)', 'Trinity Dwarka', 'TRINITY-I', 1, TRUE),
('240', 'TRINITY INSTITUTE OF PROFESSIONAL STUDIES (SHIFT II)', 'Trinity Dwarka', 'TRINITY-II', 2, TRUE)
ON CONFLICT (inst_code) DO NOTHING;
