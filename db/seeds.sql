-- =============================================================
-- DORA Compliance Dashboard — Seed Data
-- T0 Pillar Qualification Questions
-- These are static reference data — do NOT modify question_keys
-- as they are referenced in application logic.
-- =============================================================

CREATE TABLE IF NOT EXISTS pillar_questions (
    question_key  TEXT PRIMARY KEY,   -- e.g. 'P1_Q1'
    pillar        TEXT NOT NULL CHECK(pillar IN ('P1','P2','P3','P4','P5')),
    question_text TEXT NOT NULL,
    sort_order    INTEGER NOT NULL
);

INSERT OR IGNORE INTO pillar_questions (question_key, pillar, question_text, sort_order) VALUES

-- P1 — ICT Risk Management (Art. 5–15)
('P1_Q1', 'P1', 'The system supports critical or important functions of the institution?',               1),
('P1_Q2', 'P1', 'The system processes financial or client data?',                                        2),
('P1_Q3', 'P1', 'The project involves changes to production infrastructure?',                            3),
('P1_Q4', 'P1', 'The project introduces new technologies or architectures?',                             4),

-- P2 — Incident Management (Art. 17–23)
('P2_Q1', 'P2', 'The system will be in production and subject to continuous monitoring?',                5),
('P2_Q2', 'P2', 'A failure of the system could cause interruption of financial services?',              6),
('P2_Q3', 'P2', 'The system processes real-time transactions?',                                          7),

-- P3 — Digital Operational Resilience Testing (Art. 24–27)
('P3_Q1', 'P3', 'The project affects systems classified as critical by the institution?',                8),
('P3_Q2', 'P3', 'The institution is subject to mandatory TLPT (Art. 26) for this type of system?',      9),
('P3_Q3', 'P3', 'The project introduces significant changes to existing systems?',                      10),

-- P4 — Third-Party Risk Management (Art. 28–44)
('P4_Q1', 'P4', 'The project involves external ICT suppliers?',                                         11),
('P4_Q2', 'P4', 'Any supplier will have access to critical systems or data?',                           12),
('P4_Q3', 'P4', 'The project depends on cloud services or third-party infrastructure?',                 13),

-- P5 — Information Sharing (Art. 45–49)
('P5_Q1', 'P5', 'The institution participates in information sharing agreements?',                      14),
('P5_Q2', 'P5', 'The project involves systems where indicators of compromise must be reported to the sector?', 15);
