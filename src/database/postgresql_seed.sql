-- ============================================================================
-- FIFA World Cup 2026 Prediction Applet
-- PostgreSQL & MySQL Initial Seed File (Mock & Real Setup Sync)
-- Path: /src/database/postgresql_seed.sql
-- ============================================================================

-- Seed Default Teams
INSERT INTO teams (id, name, code, flag, group_name, points, played, won, drawn, lost) VALUES
('t_mexico', 'Mexico', 'MEX', '🇲🇽', 'Group A', 0, 0, 0, 0, 0) ON CONFLICT(id) DO NOTHING;
INSERT INTO teams (id, name, code, flag, group_name, points, played, won, drawn, lost) VALUES
('t_safrica', 'South Africa', 'RSA', '🇿🇦', 'Group A', 0, 0, 0, 0, 0) ON CONFLICT(id) DO NOTHING;
INSERT INTO teams (id, name, code, flag, group_name, points, played, won, drawn, lost) VALUES
('t_korea', 'Korea Republic', 'KOR', '🇰🇷', 'Group A', 0, 0, 0, 0, 0) ON CONFLICT(id) DO NOTHING;
INSERT INTO teams (id, name, code, flag, group_name, points, played, won, drawn, lost) VALUES
('t_czech', 'Czechia', 'CZE', '🇨🇿', 'Group A', 0, 0, 0, 0, 0) ON CONFLICT(id) DO NOTHING;
INSERT INTO teams (id, name, code, flag, group_name, points, played, won, drawn, lost) VALUES
('t_canada', 'Canada', 'CAN', '🇨🇦', 'Group B', 0, 0, 0, 0, 0) ON CONFLICT(id) DO NOTHING;
INSERT INTO teams (id, name, code, flag, group_name, points, played, won, drawn, lost) VALUES
('t_usa', 'USA', 'USA', '🇺🇸', 'Group D', 0, 0, 0, 0, 0) ON CONFLICT(id) DO NOTHING;
INSERT INTO teams (id, name, code, flag, group_name, points, played, won, drawn, lost) VALUES
('t_brazil', 'Brazil', 'BRA', '🇧🇷', 'Group C', 0, 0, 0, 0, 0) ON CONFLICT(id) DO NOTHING;

-- Seed Admin/SuperAdmin Users
INSERT INTO users (id, name, username, employeeId, email, mobile, country, role, is_paid, points, accuracy) VALUES
('u_admin_std', 'Sanjit Standard Admin', 'sanjit_std', 100, 'ranjansanjit2023@gmail.com', '+977-9800000001', 'Nepal', 'admin', TRUE, 9999, 100) ON CONFLICT(id) DO NOTHING;
INSERT INTO users (id, name, username, employeeId, email, mobile, country, role, is_paid, points, accuracy) VALUES
('u_admin_super', 'Sanjit Super Admin', 'sanjit_super', 101, 'ranjansanjit@gmail.com', '+977-9800000002', 'Nepal', 'superadmin', TRUE, 9999, 100) ON CONFLICT(id) DO NOTHING;
INSERT INTO users (id, name, username, employeeId, email, mobile, country, role, is_paid, points, accuracy) VALUES
('u1', 'Sah Rolex', 'sah_rolex', 102, 'sahrolex10@gmail.com', '+977-9812345678', 'Nepal', 'superadmin', TRUE, 1250, 82) ON CONFLICT(id) DO NOTHING;
INSERT INTO users (id, name, username, employeeId, email, mobile, country, role, is_paid, points, accuracy) VALUES
('u2', 'Alex Johnson', 'alex', 103, 'alex@predict.com', '+1-555123456', 'USA', 'user', TRUE, 1100, 75) ON CONFLICT(id) DO NOTHING;
INSERT INTO users (id, name, username, employeeId, email, mobile, country, role, is_paid, points, accuracy) VALUES
('u3', 'Rohit Sharma', 'rohit', 104, 'rohit@fifafan.com', '+91-9988776655', 'India', 'user', FALSE, 400, 60) ON CONFLICT(id) DO NOTHING;

-- Seed Upcoming Matches
INSERT INTO matches (id, team_a, team_b, flag_a, flag_b, status, score_a, score_b, start_time, npt_time, group_name, possession_a, locked, is_hidden) VALUES
('m1', 'Mexico', 'South Africa', '🇲🇽', '🇿🇦', 'upcoming', 0, 0, '2026-06-11 19:00:00', 'राति 12:45 बजे (11 Jun)', 'Group A', 50, FALSE, FALSE) ON CONFLICT(id) DO NOTHING;
INSERT INTO matches (id, team_a, team_b, flag_a, flag_b, status, score_a, score_b, start_time, npt_time, group_name, possession_a, locked, is_hidden) VALUES
('m2', 'Korea Republic', 'Czechia', '🇰🇷', '🇨🇿', 'upcoming', 0, 0, '2026-06-11 15:00:00', 'साँझ 8:45 बजे (11 Jun)', 'Group A', 50, FALSE, FALSE) ON CONFLICT(id) DO NOTHING;
INSERT INTO matches (id, team_a, team_b, flag_a, flag_b, status, score_a, score_b, start_time, npt_time, group_name, possession_a, locked, is_hidden) VALUES
('m3', 'Canada', 'Bosnia & Herzegovina', '🇨🇦', '🇧🇦', 'upcoming', 0, 0, '2026-06-12 15:00:00', 'साँझ 8:45 बजे (12 Jun)', 'Group B', 50, FALSE, FALSE) ON CONFLICT(id) DO NOTHING;
