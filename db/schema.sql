-- =============================================================
-- DORA Compliance Dashboard — SQLite Schema
-- =============================================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode  = WAL;

-- =============================================================
-- PROJECTS
-- =============================================================

CREATE TABLE IF NOT EXISTS projects (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT    NOT NULL,
    institution   TEXT    NOT NULL,
    responsible   TEXT    NOT NULL,
    methodology   TEXT    NOT NULL CHECK(methodology IN ('AGILE','TRADITIONAL','HYBRID')),
    criticality   TEXT             CHECK(criticality IN ('CRITICAL','HIGH','MEDIUM','LOW')),
    -- Activated pillars — derived from T0 answers and cached here after T0 approval
    p1_active     INTEGER NOT NULL DEFAULT 0,
    p2_active     INTEGER NOT NULL DEFAULT 0,
    p3_active     INTEGER NOT NULL DEFAULT 0,
    p4_active     INTEGER NOT NULL DEFAULT 0,
    p5_active     INTEGER NOT NULL DEFAULT 0,
    status        TEXT    NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','COMPLETED')),
    created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TRIGGER IF NOT EXISTS trg_projects_updated
AFTER UPDATE ON projects FOR EACH ROW
BEGIN
    UPDATE projects SET updated_at = datetime('now') WHERE id = OLD.id;
END;

-- =============================================================
-- TEMPLATES  (T0–T5)
-- T0 and T5: one instance per project (sprint_number IS NULL)
-- T1–T4:     one instance per sprint   (sprint_number >= 1)
-- =============================================================

CREATE TABLE IF NOT EXISTS templates (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id    INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    type          TEXT    NOT NULL CHECK(type IN ('T0','T1','T2','T3','T4','T5')),
    sprint_number INTEGER,
    filled_by     TEXT,
    filled_at     TEXT,
    approved_by   TEXT,
    approved_at   TEXT,
    status        TEXT    NOT NULL DEFAULT 'NOT_STARTED'
                          CHECK(status IN ('NOT_STARTED','IN_PROGRESS','COMPLETE','INCOMPLETE')),
    created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE(project_id, type, sprint_number)
);

CREATE TRIGGER IF NOT EXISTS trg_templates_updated
AFTER UPDATE ON templates FOR EACH ROW
BEGIN
    UPDATE templates SET updated_at = datetime('now') WHERE id = OLD.id;
END;

-- =============================================================
-- T0 — PILLAR QUALIFICATION ANSWERS
-- question_key format: 'P1_Q1' … 'P5_Q2'
-- =============================================================

CREATE TABLE IF NOT EXISTS t0_pillar_answers (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id   INTEGER NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    pillar        TEXT    NOT NULL CHECK(pillar IN ('P1','P2','P3','P4','P5')),
    question_key  TEXT    NOT NULL,
    answer        INTEGER NOT NULL CHECK(answer IN (0,1)),
    UNIQUE(template_id, question_key)
);

-- =============================================================
-- T1 — REQUIREMENTS & PLANNING
-- =============================================================

-- Scalar fields
CREATE TABLE IF NOT EXISTS t1_data (
    template_id                   INTEGER PRIMARY KEY REFERENCES templates(id) ON DELETE CASCADE,
    incident_response_plan_status TEXT CHECK(incident_response_plan_status
                                        IN ('ACTIVE','DRAFT','PENDING_REVIEW','NOT_APPLICABLE')),
    dora_impact_verified          INTEGER NOT NULL DEFAULT 0,
    notes                         TEXT
);

-- User Stories with security acceptance criteria  [P1]
CREATE TABLE IF NOT EXISTS t1_user_stories (
    id                          INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id                 INTEGER NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    story_ref                   TEXT    NOT NULL,   -- e.g. US-001
    description                 TEXT    NOT NULL,
    affects_critical_system     INTEGER NOT NULL DEFAULT 0,
    introduces_ict_risk         INTEGER NOT NULL DEFAULT 0,
    production_change           INTEGER NOT NULL DEFAULT 0,
    new_third_party             INTEGER NOT NULL DEFAULT 0,
    criteria_confidentiality    TEXT,
    criteria_integrity          TEXT,
    criteria_availability       TEXT
);

-- ICT Risk Register  [P1]
CREATE TABLE IF NOT EXISTS t1_risks (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id  INTEGER NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    risk_ref     TEXT    NOT NULL,   -- e.g. R-001
    description  TEXT    NOT NULL,
    probability  TEXT    NOT NULL CHECK(probability IN ('HIGH','MEDIUM','LOW')),
    impact       TEXT    NOT NULL CHECK(impact IN ('HIGH','MEDIUM','LOW')),
    pillar       TEXT    NOT NULL CHECK(pillar IN ('P1','P2','P3','P4','P5')),
    mitigation   TEXT,
    status       TEXT    NOT NULL DEFAULT 'OPEN'
                         CHECK(status IN ('OPEN','MITIGATED','ACCEPTED'))
);

-- Third-Party Suppliers  [P4]
CREATE TABLE IF NOT EXISTS t1_suppliers (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id             INTEGER NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    supplier_name           TEXT    NOT NULL,
    service_description     TEXT,
    contract_status         TEXT    CHECK(contract_status IN ('IN_FORCE','PENDING','EXPIRED')),
    critical_system_access  INTEGER NOT NULL DEFAULT 0
);

-- =============================================================
-- T2 — DESIGN & ARCHITECTURE
-- =============================================================

-- Scalar fields
CREATE TABLE IF NOT EXISTS t2_data (
    template_id                 INTEGER PRIMARY KEY REFERENCES templates(id) ON DELETE CASCADE,
    -- Zero Trust
    zero_trust_mutual_auth      INTEGER NOT NULL DEFAULT 0,
    zero_trust_segmentation     INTEGER NOT NULL DEFAULT 0,
    zero_trust_least_privilege  INTEGER NOT NULL DEFAULT 0,
    -- Resilience
    circuit_breakers            INTEGER NOT NULL DEFAULT 0,
    failover_configured         INTEGER NOT NULL DEFAULT 0,
    drp_documented              INTEGER NOT NULL DEFAULT 0,
    redundancy_configured       INTEGER NOT NULL DEFAULT 0,
    backup_strategy_defined     INTEGER NOT NULL DEFAULT 0,
    notes                       TEXT
);

-- Threat Model — STRIDE  [P1]
CREATE TABLE IF NOT EXISTS t2_threats (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id     INTEGER NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    threat_ref      TEXT    NOT NULL,   -- e.g. TM-001
    stride_category TEXT    NOT NULL
                            CHECK(stride_category IN (
                                'SPOOFING','TAMPERING','REPUDIATION',
                                'INFORMATION_DISCLOSURE','DENIAL_OF_SERVICE',
                                'ELEVATION_OF_PRIVILEGE')),
    description     TEXT    NOT NULL,
    affected_asset  TEXT,
    risk_level      TEXT    CHECK(risk_level IN ('HIGH','MEDIUM','LOW')),
    mitigation      TEXT,
    test_ref        TEXT    -- traceability to T4: TS-XX
);

-- Architectural Decision Records  [P1] — mandatory Risk Manager approval to close T2
CREATE TABLE IF NOT EXISTS t2_adrs (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id             INTEGER NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    adr_ref                 TEXT    NOT NULL,   -- e.g. ADR-001
    decision                TEXT    NOT NULL,
    context                 TEXT,
    alternatives            TEXT,
    security_justification  TEXT,
    dora_implications       TEXT,
    risk_mgr_approved       INTEGER NOT NULL DEFAULT 0,
    approved_at             TEXT
);

-- Supplier SLAs  [P4]
CREATE TABLE IF NOT EXISTS t2_supplier_slas (
    id                           INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id                  INTEGER NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    supplier_name                TEXT    NOT NULL,
    availability_sla             TEXT,   -- e.g. "99.9%"
    incident_notification_clause INTEGER NOT NULL DEFAULT 0,
    audit_rights                 INTEGER NOT NULL DEFAULT 0,
    sla_status                   TEXT    CHECK(sla_status IN ('IN_FORCE','PENDING','EXPIRED'))
);

-- =============================================================
-- T3 — IMPLEMENTATION
-- =============================================================

-- Scalar fields
CREATE TABLE IF NOT EXISTS t3_data (
    template_id                  INTEGER PRIMARY KEY REFERENCES templates(id) ON DELETE CASCADE,
    -- Secure coding  [P1]
    owasp_guidelines_followed    INTEGER NOT NULL DEFAULT 0,
    code_review_completed        INTEGER NOT NULL DEFAULT 0,
    secrets_management_active    INTEGER NOT NULL DEFAULT 0,
    input_validation_active      INTEGER NOT NULL DEFAULT 0,
    auth_mechanisms_documented   INTEGER NOT NULL DEFAULT 0,
    -- Audit trail & logging  [P1/P2]
    structured_logging_active    INTEGER NOT NULL DEFAULT 0,
    audit_trail_auto_generated   INTEGER NOT NULL DEFAULT 0,
    log_retention_7yr            INTEGER NOT NULL DEFAULT 0,
    tamper_protection_active     INTEGER NOT NULL DEFAULT 0,
    -- Dependencies  [P1]
    dependency_inventory_updated INTEGER NOT NULL DEFAULT 0,
    -- Third-party  [P4]
    supplier_access_monitored    INTEGER NOT NULL DEFAULT 0,
    notes                        TEXT
);

-- CI/CD Pipeline Security Scans  [P1]
-- A CVSS >= 7.0 unresolved vuln in a SAST/SCA scan generates a Critical alert
CREATE TABLE IF NOT EXISTS t3_pipeline_scans (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id    INTEGER NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    scan_type      TEXT    NOT NULL CHECK(scan_type IN ('SAST','SCA','IAC')),
    tool_used      TEXT,
    scan_date      TEXT,
    result         TEXT    NOT NULL CHECK(result IN ('PASS','FAIL','NOT_RUN')),
    critical_vulns INTEGER NOT NULL DEFAULT 0,  -- count of unresolved CVSS >= 7.0
    report_ref     TEXT
);

-- Dependency / Supply Chain Inventory  [P1]
CREATE TABLE IF NOT EXISTS t3_dependencies (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id  INTEGER NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    package_name TEXT    NOT NULL,
    version      TEXT,
    cve_id       TEXT,
    cvss_score   REAL,
    status       TEXT    CHECK(status IN ('APPROVED','FLAGGED','REMEDIATED'))
);

-- =============================================================
-- T4 — TESTING
-- =============================================================

-- Scalar fields
CREATE TABLE IF NOT EXISTS t4_data (
    template_id                     INTEGER PRIMARY KEY REFERENCES templates(id) ON DELETE CASCADE,
    -- TLPT  [P3]
    tlpt_applicable                 INTEGER NOT NULL DEFAULT 0,
    tlpt_completed_or_scheduled     INTEGER NOT NULL DEFAULT 0,
    tlpt_date                       TEXT,
    -- Compliance verification
    audit_trail_integrity_verified  INTEGER NOT NULL DEFAULT 0,
    incident_response_tested        INTEGER NOT NULL DEFAULT 0,
    risk_assessments_validated      INTEGER NOT NULL DEFAULT 0,
    notes                           TEXT
);

-- Functional Security Tests  [P1] — traceability from T2 threat model
CREATE TABLE IF NOT EXISTS t4_security_tests (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id INTEGER NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    test_ref    TEXT    NOT NULL,   -- e.g. TS-001
    threat_ref  TEXT,              -- links to t2_threats.threat_ref
    description TEXT,
    result      TEXT    NOT NULL CHECK(result IN ('PASS','FAIL','NOT_RUN')),
    evidence_ref TEXT
);

-- Penetration Testing  [P3]
CREATE TABLE IF NOT EXISTS t4_pen_tests (
    id                        INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id               INTEGER NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    test_date                 TEXT,
    responsible_entity        TEXT,
    scope                     TEXT,
    critical_vulns_found      INTEGER NOT NULL DEFAULT 0,
    critical_vulns_remediated INTEGER NOT NULL DEFAULT 0,
    formal_report_ref         TEXT,
    status                    TEXT CHECK(status IN ('COMPLETED','SCHEDULED','NOT_APPLICABLE'))
);

-- Resilience Tests: DR / BCP / Chaos / RTO  [P3]
CREATE TABLE IF NOT EXISTS t4_resilience_tests (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id INTEGER NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    test_type   TEXT    NOT NULL
                        CHECK(test_type IN ('DR','BCP','CHAOS_ENGINEERING','RTO_MEASUREMENT')),
    test_date   TEXT,
    rto_target  TEXT,
    rto_achieved TEXT,
    result      TEXT    CHECK(result IN ('PASS','FAIL','NOT_RUN')),
    notes       TEXT
);

-- Supplier Failure Simulations  [P4]
CREATE TABLE IF NOT EXISTS t4_supplier_failure_sims (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id           INTEGER NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    supplier_name         TEXT    NOT NULL,
    scenario_description  TEXT,
    contingency_activated INTEGER NOT NULL DEFAULT 0,
    result                TEXT    CHECK(result IN ('PASS','FAIL','NOT_RUN'))
);

-- =============================================================
-- T5 — DEPLOYMENT & OPERATIONS
-- =============================================================

-- Scalar fields
CREATE TABLE IF NOT EXISTS t5_data (
    template_id                       INTEGER PRIMARY KEY REFERENCES templates(id) ON DELETE CASCADE,
    -- Secure deployment  [P1]
    pre_deploy_security_validated     INTEGER NOT NULL DEFAULT 0,
    system_hardening_completed        INTEGER NOT NULL DEFAULT 0,
    secrets_rotated                   INTEGER NOT NULL DEFAULT 0,
    post_deploy_scan_done             INTEGER NOT NULL DEFAULT 0,
    rollback_plan_documented          INTEGER NOT NULL DEFAULT 0,
    -- Security monitoring  [P1]
    siem_active                       INTEGER NOT NULL DEFAULT 0,
    infra_monitoring_rules_defined    INTEGER NOT NULL DEFAULT 0,
    threat_intelligence_feeds_active  INTEGER NOT NULL DEFAULT 0,
    continuous_vuln_assessment_active INTEGER NOT NULL DEFAULT 0,
    -- Incident management  [P2]
    incident_response_plan_active     INTEGER NOT NULL DEFAULT 0,
    notification_4h_documented        INTEGER NOT NULL DEFAULT 0,  -- Art. 19
    notification_4h_tested            INTEGER NOT NULL DEFAULT 0,
    incident_classification_defined   INTEGER NOT NULL DEFAULT 0,
    authority_contacts_identified     INTEGER NOT NULL DEFAULT 0,
    post_mortem_process_defined       INTEGER NOT NULL DEFAULT 0,
    notes                             TEXT
);

-- Incidents  [P2]
CREATE TABLE IF NOT EXISTS t5_incidents (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id             INTEGER NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    incident_ref            TEXT    NOT NULL,
    classification          TEXT,
    detected_at             TEXT,
    notified_at             TEXT,
    notification_within_4h  INTEGER NOT NULL DEFAULT 0,  -- Art. 19 compliance flag
    authority_notified      TEXT,
    post_mortem_completed   INTEGER NOT NULL DEFAULT 0,
    status                  TEXT    CHECK(status IN ('OPEN','RESOLVED','CLOSED'))
);

-- Supplier Annual Evaluations  [P4]
CREATE TABLE IF NOT EXISTS t5_supplier_evaluations (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id       INTEGER NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    supplier_name     TEXT    NOT NULL,
    last_review_date  TEXT,
    sla_met           INTEGER NOT NULL DEFAULT 0,
    incidents_count   INTEGER NOT NULL DEFAULT 0,
    evaluation_status TEXT    CHECK(evaluation_status IN ('PASS','FAIL','PENDING'))
);

-- Information Sharing Agreements  [P5] — only in T5
CREATE TABLE IF NOT EXISTS t5_sharing_agreements (
    id                           INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id                  INTEGER NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    agreement_name               TEXT    NOT NULL,
    ioc_sharing_active           INTEGER NOT NULL DEFAULT 0,
    threat_intel_incorporated    INTEGER NOT NULL DEFAULT 0,
    authority_reporting_active   INTEGER NOT NULL DEFAULT 0
);

-- =============================================================
-- EVIDENCE TRACKING
-- Tracks collection status per (template, section, field).
-- Populated/refreshed by the backend after each template save.
-- =============================================================

CREATE TABLE IF NOT EXISTS evidence (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id INTEGER NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    pillar      TEXT    NOT NULL CHECK(pillar IN ('P1','P2','P3','P4','P5','GENERAL')),
    section     TEXT    NOT NULL,  -- e.g. 'secure_coding', 'threat_modeling'
    field_key   TEXT    NOT NULL,  -- matches column name in t*_data or child table
    status      TEXT    NOT NULL DEFAULT 'MISSING'
                        CHECK(status IN ('COLLECTED','INCOMPLETE','MISSING','NA')),
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE(template_id, field_key)
);

CREATE TRIGGER IF NOT EXISTS trg_evidence_updated
AFTER UPDATE ON evidence FOR EACH ROW
BEGIN
    UPDATE evidence SET updated_at = datetime('now') WHERE id = OLD.id;
END;

-- =============================================================
-- ALERTS
-- Generated automatically by business rules (see key_rules below).
-- resolved_at IS NULL  →  open alert
-- =============================================================

CREATE TABLE IF NOT EXISTS alerts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    template_id INTEGER          REFERENCES templates(id) ON DELETE SET NULL,
    pillar      TEXT             CHECK(pillar IN ('P1','P2','P3','P4','P5')),
    severity    TEXT    NOT NULL CHECK(severity IN ('CRITICAL','WARNING')),
    -- Machine-readable rule identifier for deduplication
    rule_key    TEXT    NOT NULL,
    description TEXT    NOT NULL,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    resolved_at TEXT
);

-- =============================================================
-- COMPLIANCE SCORES
-- Recalculated by the backend on each template save.
-- phase='GLOBAL' + pillar='ALL'  →  overall project score
-- =============================================================

CREATE TABLE IF NOT EXISTS compliance_scores (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id    INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    phase         TEXT    NOT NULL CHECK(phase IN ('T0','T1','T2','T3','T4','T5','GLOBAL')),
    pillar        TEXT    NOT NULL CHECK(pillar IN ('P1','P2','P3','P4','P5','ALL')),
    score         REAL    NOT NULL CHECK(score >= 0 AND score <= 100),
    calculated_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- =============================================================
-- INDEXES
-- =============================================================

CREATE INDEX IF NOT EXISTS idx_templates_project        ON templates(project_id);
CREATE INDEX IF NOT EXISTS idx_templates_type           ON templates(type);
CREATE INDEX IF NOT EXISTS idx_evidence_template        ON evidence(template_id);
CREATE INDEX IF NOT EXISTS idx_evidence_status          ON evidence(status);
CREATE INDEX IF NOT EXISTS idx_alerts_project           ON alerts(project_id);
CREATE INDEX IF NOT EXISTS idx_alerts_open              ON alerts(project_id) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_scores_project           ON compliance_scores(project_id);
CREATE INDEX IF NOT EXISTS idx_scores_phase_pillar      ON compliance_scores(project_id, phase, pillar);
CREATE INDEX IF NOT EXISTS idx_t1_risks_template        ON t1_risks(template_id);
CREATE INDEX IF NOT EXISTS idx_t2_threats_template      ON t2_threats(template_id);
CREATE INDEX IF NOT EXISTS idx_t2_adrs_template         ON t2_adrs(template_id);
CREATE INDEX IF NOT EXISTS idx_t3_scans_template        ON t3_pipeline_scans(template_id);
CREATE INDEX IF NOT EXISTS idx_t4_sectests_template     ON t4_security_tests(template_id);
CREATE INDEX IF NOT EXISTS idx_t5_incidents_template    ON t5_incidents(template_id);
