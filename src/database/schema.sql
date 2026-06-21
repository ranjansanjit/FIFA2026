-- ============================================================================
-- FIFA World Cup 2026 Prediction Applet
-- Relational Database Schema (PostgreSQL & MySQL Compatible)
-- Created in /src/database/schema.sql
-- ============================================================================

-- CREATE DATABASE STATEMENT (UNCOMMENT IF REQUIRED WHEN PROVISIONING)
-- CREATE DATABASE fifa_predictor_db ENCODING 'UTF8';

-- ============================================================================
-- 1. Users Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    employeeId INT UNIQUE NOT NULL, -- Mandatory ex 104 employee ID restriction
    email VARCHAR(100) UNIQUE NOT NULL,
    mobile VARCHAR(30),
    country VARCHAR(50) DEFAULT 'Nepal',
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin')),
    is_paid BOOLEAN DEFAULT FALSE,
    points INT DEFAULT 0,
    accuracy INT DEFAULT 0,
    predictions_completed INT DEFAULT 0,
    badge VARCHAR(50) DEFAULT 'Bronze Predictor',
    rank INT DEFAULT 9999,
    referral_code VARCHAR(50) UNIQUE,
    referred_count INT DEFAULT 0,
    daily_check_in_chain INT DEFAULT 0,
    last_check_in DATE,
    is_disabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for frequent searches
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_points ON users(points DESC);
CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employeeId);


-- ============================================================================
-- 2. Teams Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS teams (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE,
    flag VARCHAR(20) DEFAULT '🏳️',
    group_name VARCHAR(20) DEFAULT 'Group Stage',
    points INT DEFAULT 0,
    played INT DEFAULT 0,
    won INT DEFAULT 0,
    drawn INT DEFAULT 0,
    lost INT DEFAULT 0,
    goals_for INT DEFAULT 0,
    goals_against INT DEFAULT 0,
    is_hidden BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================================
-- 3. Matches Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS matches (
    id VARCHAR(50) PRIMARY KEY,
    team_a VARCHAR(100) NOT NULL REFERENCES teams(name) ON UPDATE CASCADE,
    team_b VARCHAR(100) NOT NULL REFERENCES teams(name) ON UPDATE CASCADE,
    flag_a VARCHAR(20) DEFAULT '🏳️',
    flag_b VARCHAR(20) DEFAULT '🏳️',
    status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed')),
    score_a INT DEFAULT 0,
    score_b INT DEFAULT 0,
    start_time TIMESTAMP NOT NULL,
    npt_time VARCHAR(100), -- Kathmandu, Nepal localization display
    group_name VARCHAR(50) DEFAULT 'Group Stage',
    possession_a INT DEFAULT 50,
    locked BOOLEAN DEFAULT FALSE,
    is_hidden BOOLEAN DEFAULT FALSE,
    timeline JSONB, -- Embedded timeline events e.g. Goals, Cards
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================================
-- 4. Predictions Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS predictions (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    match_id VARCHAR(50) NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    predicted_score_a INT NOT NULLCheck (predicted_score_a >= 0),
    predicted_score_b INT NOT NULLCheck (predicted_score_b >= 0),
    predicted_winner VARCHAR(10) DEFAULT 'draw', -- 'A', 'B', or 'draw'
    points_granted INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'purged')),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_match_prediction UNIQUE (user_id, match_id)
);


-- ============================================================================
-- 5. Payment Transactions Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS payment_transactions (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INT NOT NULL, -- NRs currency cash volume details
    gateway VARCHAR(20) DEFAULT 'eSewa' CHECK (gateway IN ('eSewa', 'Khalti', 'PayPal', 'Credit Card')),
    txn_id VARCHAR(120) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'SUCCESS' CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED')),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    details VARCHAR(255)
);


-- ============================================================================
-- 6. Live Questions Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS live_questions (
    id VARCHAR(50) PRIMARY KEY,
    match_id VARCHAR(50) REFERENCES matches(id) ON DELETE CASCADE,
    text VARCHAR(255) NOT NULL,
    options TEXT[], -- Option arrays
    points INT DEFAULT 20,
    correct_ans VARCHAR(100),
    resolved BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================================
-- 7. User Live Answers Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_live_answers (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id VARCHAR(50) NOT NULL REFERENCES live_questions(id) ON DELETE CASCADE,
    match_id VARCHAR(50) NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    selected_option VARCHAR(100) NOT NULL,
    points_granted INT DEFAULT 0,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_active_question UNIQUE (user_id, question_id)
);


-- ============================================================================
-- 8. Chat Messages Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_name VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    reactions JSONB DEFAULT '[]'::jsonb, -- Array list of emoji reactions
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================================
-- 9. Security Logs Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS security_logs (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    type VARCHAR(50) NOT NULL,
    detail TEXT NOT NULL
);
