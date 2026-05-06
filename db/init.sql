-- =============================================================
-- DORA Compliance Dashboard
-- Script de inicialização completo — SQLite
--
-- Como usar no DBeaver:
--   1. File > Open File  →  selecionar este ficheiro
--   2. Ctrl+A  para selecionar tudo
--   3. Alt+X   para executar
-- =============================================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode  = WAL;

-- =============================================================
-- PROJECTS
-- =============================================================

CREATE TABLE IF NOT EXISTS projects (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    name                 TEXT    NOT NULL,
    institution          TEXT    NOT NULL,
    responsible          TEXT    NOT NULL,
    sprint_duration_days INTEGER NOT NULL DEFAULT 14,
    criticality          TEXT             CHECK(criticality IN ('CRITICAL','HIGH','MEDIUM','LOW')),
    -- Pilares ativados — derivados das respostas T0, cacheados aqui após aprovação
    p1_active            INTEGER NOT NULL DEFAULT 0,
    p2_active            INTEGER NOT NULL DEFAULT 0,
    p3_active            INTEGER NOT NULL DEFAULT 0,
    p4_active            INTEGER NOT NULL DEFAULT 0,
    p5_active            INTEGER NOT NULL DEFAULT 0,
    status               TEXT    NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','COMPLETED')),
    created_at           TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at           TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TRIGGER IF NOT EXISTS trg_projects_updated
AFTER UPDATE ON projects FOR EACH ROW
BEGIN
    UPDATE projects SET updated_at = datetime('now') WHERE id = OLD.id;
END;

-- =============================================================
-- TEMPLATES  (T0–T5)
-- T0     : uma instância por projeto  (sprint_number IS NULL)
-- T1–T5  : uma instância por sprint   (sprint_number >= 1)  — DevSecOps: cada sprint pode ter deploy (T5)
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
-- question_key: 'P1_Q1' … 'P5_Q2'
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

CREATE TABLE IF NOT EXISTS t1_data (
    template_id                   INTEGER PRIMARY KEY REFERENCES templates(id) ON DELETE CASCADE,
    incident_response_plan_status TEXT CHECK(incident_response_plan_status
                                        IN ('ACTIVE','DRAFT','PENDING_REVIEW','NOT_APPLICABLE')),
    dora_impact_verified          INTEGER NOT NULL DEFAULT 0,
    notes                         TEXT
);

-- User Stories com critérios de segurança  [P1]
CREATE TABLE IF NOT EXISTS t1_user_stories (
    id                        INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id               INTEGER NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    story_ref                 TEXT    NOT NULL,
    description               TEXT    NOT NULL,
    affects_critical_system   INTEGER NOT NULL DEFAULT 0,
    introduces_ict_risk       INTEGER NOT NULL DEFAULT 0,
    production_change         INTEGER NOT NULL DEFAULT 0,
    new_third_party           INTEGER NOT NULL DEFAULT 0,
    criteria_confidentiality  TEXT,
    criteria_integrity        TEXT,
    criteria_availability     TEXT
);

-- Registo de Riscos ICT  [P1]
CREATE TABLE IF NOT EXISTS t1_risks (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id  INTEGER NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    risk_ref     TEXT    NOT NULL,
    description  TEXT    NOT NULL,
    probability  TEXT    NOT NULL CHECK(probability IN ('HIGH','MEDIUM','LOW')),
    impact       TEXT    NOT NULL CHECK(impact IN ('HIGH','MEDIUM','LOW')),
    pillar       TEXT    NOT NULL CHECK(pillar IN ('P1','P2','P3','P4','P5')),
    mitigation   TEXT,
    status       TEXT    NOT NULL DEFAULT 'OPEN'
                         CHECK(status IN ('OPEN','MITIGATED','ACCEPTED'))
);

-- Fornecedores terceiros  [P4]
CREATE TABLE IF NOT EXISTS t1_suppliers (
    id                     INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id            INTEGER NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    supplier_name          TEXT    NOT NULL,
    service_description    TEXT,
    contract_status        TEXT    CHECK(contract_status IN ('IN_FORCE','PENDING','EXPIRED')),
    critical_system_access INTEGER NOT NULL DEFAULT 0
);

-- =============================================================
-- T2 — DESIGN & ARCHITECTURE
-- =============================================================

CREATE TABLE IF NOT EXISTS t2_data (
    template_id                 INTEGER PRIMARY KEY REFERENCES templates(id) ON DELETE CASCADE,
    -- Zero Trust  [P1]
    zero_trust_mutual_auth      INTEGER NOT NULL DEFAULT 0,
    zero_trust_segmentation     INTEGER NOT NULL DEFAULT 0,
    zero_trust_least_privilege  INTEGER NOT NULL DEFAULT 0,
    -- Resiliência  [P1/P2]
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
    threat_ref      TEXT    NOT NULL,
    stride_category TEXT    NOT NULL
                            CHECK(stride_category IN (
                                'SPOOFING','TAMPERING','REPUDIATION',
                                'INFORMATION_DISCLOSURE','DENIAL_OF_SERVICE',
                                'ELEVATION_OF_PRIVILEGE')),
    description     TEXT    NOT NULL,
    affected_asset  TEXT,
    risk_level      TEXT    CHECK(risk_level IN ('HIGH','MEDIUM','LOW')),
    mitigation      TEXT,
    test_ref        TEXT
);

-- ADRs — aprovação do Risk Manager obrigatória para fechar T2  [P1]
CREATE TABLE IF NOT EXISTS t2_adrs (
    id                     INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id            INTEGER NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    adr_ref                TEXT    NOT NULL,
    decision               TEXT    NOT NULL,
    context                TEXT,
    alternatives           TEXT,
    security_justification TEXT,
    dora_implications      TEXT,
    risk_mgr_approved      INTEGER NOT NULL DEFAULT 0,
    approved_at            TEXT
);

-- SLAs com fornecedores  [P4]
CREATE TABLE IF NOT EXISTS t2_supplier_slas (
    id                           INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id                  INTEGER NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    supplier_name                TEXT    NOT NULL,
    availability_sla             TEXT,
    incident_notification_clause INTEGER NOT NULL DEFAULT 0,
    audit_rights                 INTEGER NOT NULL DEFAULT 0,
    sla_status                   TEXT    CHECK(sla_status IN ('IN_FORCE','PENDING','EXPIRED'))
);

-- =============================================================
-- T3 — IMPLEMENTATION
-- =============================================================

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
    -- Dependências  [P1]
    dependency_inventory_updated INTEGER NOT NULL DEFAULT 0,
    -- Terceiros  [P4]
    supplier_access_monitored    INTEGER NOT NULL DEFAULT 0,
    notes                        TEXT
);

-- Scans de segurança CI/CD  [P1]
-- CVSS >= 7.0 não resolvido gera alerta CRITICAL
CREATE TABLE IF NOT EXISTS t3_pipeline_scans (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id    INTEGER NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    scan_type      TEXT    NOT NULL CHECK(scan_type IN ('SAST','SCA','IAC','DAST')),
    pipeline_stage TEXT             CHECK(pipeline_stage IN ('BUILD','TEST','DEPLOY')),
    environment    TEXT             CHECK(environment IN ('DEV','STAGING','PROD')),
    tool_used      TEXT,
    scan_date      TEXT,
    result         TEXT    NOT NULL CHECK(result IN ('PASS','FAIL','NOT_RUN')),
    critical_vulns INTEGER NOT NULL DEFAULT 0,
    report_ref     TEXT
);

-- Inventário de dependências  [P1]
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

CREATE TABLE IF NOT EXISTS t4_data (
    template_id                    INTEGER PRIMARY KEY REFERENCES templates(id) ON DELETE CASCADE,
    -- TLPT  [P3]
    tlpt_applicable                INTEGER NOT NULL DEFAULT 0,
    tlpt_completed_or_scheduled    INTEGER NOT NULL DEFAULT 0,
    tlpt_date                      TEXT,
    -- Verificação de conformidade
    audit_trail_integrity_verified INTEGER NOT NULL DEFAULT 0,
    incident_response_tested       INTEGER NOT NULL DEFAULT 0,
    risk_assessments_validated     INTEGER NOT NULL DEFAULT 0,
    notes                          TEXT
);

-- Testes de segurança funcionais — rastreabilidade ao threat model T2  [P1]
CREATE TABLE IF NOT EXISTS t4_security_tests (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id  INTEGER NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    test_ref     TEXT    NOT NULL,
    threat_ref   TEXT,
    description  TEXT,
    result       TEXT    NOT NULL CHECK(result IN ('PASS','FAIL','NOT_RUN')),
    evidence_ref TEXT
);

-- Pen testing  [P3]
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

-- Testes de resiliência: DR / BCP / Chaos / RTO  [P3]
CREATE TABLE IF NOT EXISTS t4_resilience_tests (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id  INTEGER NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    test_type    TEXT    NOT NULL
                         CHECK(test_type IN ('DR','BCP','CHAOS_ENGINEERING','RTO_MEASUREMENT')),
    test_date    TEXT,
    rto_target   TEXT,
    rto_achieved TEXT,
    result       TEXT    CHECK(result IN ('PASS','FAIL','NOT_RUN')),
    notes        TEXT
);

-- Simulação de falha de fornecedor  [P4]
CREATE TABLE IF NOT EXISTS t4_supplier_failure_sims (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id          INTEGER NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    supplier_name        TEXT    NOT NULL,
    scenario_description TEXT,
    contingency_activated INTEGER NOT NULL DEFAULT 0,
    result               TEXT    CHECK(result IN ('PASS','FAIL','NOT_RUN'))
);

-- =============================================================
-- T5 — DEPLOYMENT & OPERATIONS
-- =============================================================

CREATE TABLE IF NOT EXISTS t5_data (
    template_id                       INTEGER PRIMARY KEY REFERENCES templates(id) ON DELETE CASCADE,
    -- Deployment seguro  [P1]
    pre_deploy_security_validated     INTEGER NOT NULL DEFAULT 0,
    system_hardening_completed        INTEGER NOT NULL DEFAULT 0,
    secrets_rotated                   INTEGER NOT NULL DEFAULT 0,
    post_deploy_scan_done             INTEGER NOT NULL DEFAULT 0,
    rollback_plan_documented          INTEGER NOT NULL DEFAULT 0,
    -- Monitorização de segurança  [P1]
    siem_active                       INTEGER NOT NULL DEFAULT 0,
    infra_monitoring_rules_defined    INTEGER NOT NULL DEFAULT 0,
    threat_intelligence_feeds_active  INTEGER NOT NULL DEFAULT 0,
    continuous_vuln_assessment_active INTEGER NOT NULL DEFAULT 0,
    -- Gestão de incidentes  [P2]
    incident_response_plan_active     INTEGER NOT NULL DEFAULT 0,
    notification_4h_documented        INTEGER NOT NULL DEFAULT 0,
    notification_4h_tested            INTEGER NOT NULL DEFAULT 0,
    incident_classification_defined   INTEGER NOT NULL DEFAULT 0,
    authority_contacts_identified     INTEGER NOT NULL DEFAULT 0,
    post_mortem_process_defined       INTEGER NOT NULL DEFAULT 0,
    notes                             TEXT
);

-- Incidentes  [P2]
CREATE TABLE IF NOT EXISTS t5_incidents (
    id                     INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id            INTEGER NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    incident_ref           TEXT    NOT NULL,
    classification         TEXT,
    detected_at            TEXT,
    notified_at            TEXT,
    notification_within_4h INTEGER NOT NULL DEFAULT 0,
    authority_notified     TEXT,
    post_mortem_completed  INTEGER NOT NULL DEFAULT 0,
    status                 TEXT    CHECK(status IN ('OPEN','RESOLVED','CLOSED'))
);

-- Avaliações anuais de fornecedores  [P4]
CREATE TABLE IF NOT EXISTS t5_supplier_evaluations (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id       INTEGER NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    supplier_name     TEXT    NOT NULL,
    last_review_date  TEXT,
    sla_met           INTEGER NOT NULL DEFAULT 0,
    incidents_count   INTEGER NOT NULL DEFAULT 0,
    evaluation_status TEXT    CHECK(evaluation_status IN ('PASS','FAIL','PENDING'))
);

-- Acordos de partilha de informação  [P5] — apenas em T5
CREATE TABLE IF NOT EXISTS t5_sharing_agreements (
    id                         INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id                INTEGER NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    agreement_name             TEXT    NOT NULL,
    ioc_sharing_active         INTEGER NOT NULL DEFAULT 0,
    threat_intel_incorporated  INTEGER NOT NULL DEFAULT 0,
    authority_reporting_active INTEGER NOT NULL DEFAULT 0
);

-- =============================================================
-- EVIDENCE TRACKING
-- Estado por (template, campo): calculado pelo backend após cada save.
-- =============================================================

CREATE TABLE IF NOT EXISTS evidence (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id INTEGER NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    pillar      TEXT    NOT NULL CHECK(pillar IN ('P1','P2','P3','P4','P5','GENERAL')),
    section     TEXT    NOT NULL,
    field_key   TEXT    NOT NULL,
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
-- resolved_at IS NULL  →  alerta em aberto
-- =============================================================

CREATE TABLE IF NOT EXISTS alerts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    template_id INTEGER          REFERENCES templates(id) ON DELETE SET NULL,
    pillar      TEXT             CHECK(pillar IN ('P1','P2','P3','P4','P5')),
    severity    TEXT    NOT NULL CHECK(severity IN ('CRITICAL','WARNING')),
    rule_key    TEXT    NOT NULL,
    description TEXT    NOT NULL,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    resolved_at TEXT
);

-- =============================================================
-- COMPLIANCE SCORES
-- Recalculados pelo backend a cada save de template.
-- phase='GLOBAL' + pillar='ALL'  →  score global do projeto
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
-- PILLAR QUESTIONS  (dados estáticos — não alterar question_key)
-- =============================================================

CREATE TABLE IF NOT EXISTS pillar_questions (
    question_key  TEXT    PRIMARY KEY,
    pillar        TEXT    NOT NULL CHECK(pillar IN ('P1','P2','P3','P4','P5')),
    question_text TEXT    NOT NULL,
    sort_order    INTEGER NOT NULL
);

INSERT OR IGNORE INTO pillar_questions (question_key, pillar, question_text, sort_order) VALUES
-- P1 — ICT Risk Management (Art. 5–15)
('P1_Q1', 'P1', 'O sistema suporta funções críticas ou importantes da instituição?',                     1),
('P1_Q2', 'P1', 'O sistema processa dados financeiros ou de clientes?',                                  2),
('P1_Q3', 'P1', 'O projeto envolve alterações à infraestrutura de produção?',                            3),
('P1_Q4', 'P1', 'O projeto introduz novas tecnologias ou arquiteturas?',                                 4),
-- P2 — Incident Management (Art. 17–23)
('P2_Q1', 'P2', 'O sistema estará em produção e sujeito a monitorização contínua?',                      5),
('P2_Q2', 'P2', 'Uma falha do sistema pode causar interrupção de serviços financeiros?',                 6),
('P2_Q3', 'P2', 'O sistema processa transações em tempo real?',                                          7),
-- P3 — Digital Operational Resilience Testing (Art. 24–27)
('P3_Q1', 'P3', 'O projeto afeta sistemas classificados como críticos pela instituição?',                8),
('P3_Q2', 'P3', 'A instituição está sujeita a TLPT obrigatório (Art. 26) para este tipo de sistema?',   9),
('P3_Q3', 'P3', 'O projeto introduz alterações significativas a sistemas existentes?',                  10),
-- P4 — Third-Party Risk Management (Art. 28–44)
('P4_Q1', 'P4', 'O projeto envolve fornecedores TIC externos?',                                         11),
('P4_Q2', 'P4', 'Algum fornecedor terá acesso a sistemas ou dados críticos?',                           12),
('P4_Q3', 'P4', 'O projeto depende de serviços cloud ou infraestrutura de terceiros?',                  13),
-- P5 — Information Sharing (Art. 45–49)
('P5_Q1', 'P5', 'A instituição participa em acordos de partilha de informação?',                        14),
('P5_Q2', 'P5', 'O projeto envolve sistemas onde indicadores de comprometimento devem ser reportados ao setor?', 15);

-- =============================================================
-- INDEXES
-- =============================================================

CREATE INDEX IF NOT EXISTS idx_templates_project     ON templates(project_id);
CREATE INDEX IF NOT EXISTS idx_templates_type        ON templates(type);
CREATE INDEX IF NOT EXISTS idx_evidence_template     ON evidence(template_id);
CREATE INDEX IF NOT EXISTS idx_evidence_status       ON evidence(status);
CREATE INDEX IF NOT EXISTS idx_alerts_project        ON alerts(project_id);
CREATE INDEX IF NOT EXISTS idx_alerts_open           ON alerts(project_id) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_scores_project        ON compliance_scores(project_id);
CREATE INDEX IF NOT EXISTS idx_scores_phase_pillar   ON compliance_scores(project_id, phase, pillar);
CREATE INDEX IF NOT EXISTS idx_t1_risks_template     ON t1_risks(template_id);
CREATE INDEX IF NOT EXISTS idx_t2_threats_template   ON t2_threats(template_id);
CREATE INDEX IF NOT EXISTS idx_t2_adrs_template      ON t2_adrs(template_id);
CREATE INDEX IF NOT EXISTS idx_t3_scans_template     ON t3_pipeline_scans(template_id);
CREATE INDEX IF NOT EXISTS idx_t4_sectests_template  ON t4_security_tests(template_id);
CREATE INDEX IF NOT EXISTS idx_t5_incidents_template ON t5_incidents(template_id);
