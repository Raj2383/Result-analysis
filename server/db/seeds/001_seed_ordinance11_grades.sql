-- ============================================================================
-- 001_seed_ordinance11_grades.sql
-- GGSIPU Ordinance 11 grade scale (10-point bands + status grades)
-- ============================================================================

INSERT INTO grade_scale (grade, grade_point, min_marks, max_marks, description, is_passing) VALUES
('O',   10, 90, 100, 'Outstanding', TRUE),
('A+',   9, 75,  89, 'Excellent', TRUE),
('A',    8, 65,  74, 'Very Good', TRUE),
('B+',   7, 55,  64, 'Good', TRUE),
('B',    6, 50,  54, 'Above Average', TRUE),
('C',    5, 45,  49, 'Average', TRUE),
('P',    4, 40,  44, 'Pass', TRUE),
('F',    0,  0,  39, 'Fail', FALSE),
('AB',   0, NULL, NULL, 'Absent', FALSE),
('RL',   0, NULL, NULL, 'Result Later', FALSE),
('D',    0, NULL, NULL, 'Detained', FALSE),
('CAN',  0, NULL, NULL, 'Cancelled', FALSE)
ON CONFLICT (grade) DO NOTHING;
