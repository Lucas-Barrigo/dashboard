from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


# =============================================================
# BASE CONFIG
# =============================================================

class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# =============================================================
# PROJECTS
# =============================================================

class ProjectCreate(BaseModel):
    name:                 str
    institution:          str
    responsible:          str
    sprint_duration_days: int = 14
    criticality:          Optional[str] = None

class ProjectUpdate(BaseModel):
    name:                 Optional[str] = None
    institution:          Optional[str] = None
    responsible:          Optional[str] = None
    sprint_duration_days: Optional[int] = None
    criticality:          Optional[str] = None
    status:               Optional[str] = None

class ProjectRead(ORMModel):
    id:                   int
    name:                 str
    institution:          str
    responsible:          str
    sprint_duration_days: int
    criticality:          Optional[str]
    p1_active:            bool
    p2_active:            bool
    p3_active:            bool
    p4_active:            bool
    p5_active:            bool
    status:               str
    created_at:           datetime
    updated_at:           datetime


# =============================================================
# TEMPLATES
# =============================================================

class TemplateCreate(BaseModel):
    type:         str            # T0 | T1 | T2 | T3 | T4 | T5
    sprint_number:Optional[int] = None
    filled_by:    Optional[str] = None

class TemplateRead(ORMModel):
    id:            int
    project_id:    int
    type:          str
    sprint_number: Optional[int]
    filled_by:     Optional[str]
    filled_at:     Optional[str]
    approved_by:   Optional[str]
    approved_at:   Optional[str]
    status:        str
    created_at:    datetime
    updated_at:    datetime

class TemplateApprove(BaseModel):
    approved_by: str


# =============================================================
# T0
# =============================================================

class T0Answer(BaseModel):
    question_key: str
    answer:       bool

class T0SubmitAnswers(BaseModel):
    answers:   List[T0Answer]
    filled_by: Optional[str] = None

class T0AnswerRead(ORMModel):
    id:           int
    template_id:  int
    pillar:       str
    question_key: str
    answer:       bool

class PillarQuestionRead(ORMModel):
    question_key:  str
    pillar:        str
    question_text: str
    sort_order:    int


# =============================================================
# T1
# =============================================================

class T1DataCreate(BaseModel):
    incident_response_plan_status: Optional[str] = None
    dora_impact_verified:          bool = False
    notes:                         Optional[str] = None

class T1DataRead(ORMModel):
    template_id:                   int
    incident_response_plan_status: Optional[str]
    dora_impact_verified:          bool
    notes:                         Optional[str]

class T1UserStoryCreate(BaseModel):
    story_ref:                str
    description:              str
    affects_critical_system:  bool = False
    introduces_ict_risk:      bool = False
    production_change:        bool = False
    new_third_party:          bool = False
    criteria_confidentiality: Optional[str] = None
    criteria_integrity:       Optional[str] = None
    criteria_availability:    Optional[str] = None

class T1UserStoryRead(ORMModel):
    id:                       int
    template_id:              int
    story_ref:                str
    description:              str
    affects_critical_system:  bool
    introduces_ict_risk:      bool
    production_change:        bool
    new_third_party:          bool
    criteria_confidentiality: Optional[str]
    criteria_integrity:       Optional[str]
    criteria_availability:    Optional[str]

class T1RiskCreate(BaseModel):
    risk_ref:    str
    description: str
    probability: str  # HIGH | MEDIUM | LOW
    impact:      str  # HIGH | MEDIUM | LOW
    pillar:      str  # P1–P5
    mitigation:  Optional[str] = None
    status:      str = "OPEN"

class T1RiskRead(ORMModel):
    id:          int
    template_id: int
    risk_ref:    str
    description: str
    probability: str
    impact:      str
    pillar:      str
    mitigation:  Optional[str]
    status:      str

class T1SupplierCreate(BaseModel):
    supplier_name:         str
    service_description:   Optional[str] = None
    contract_status:       Optional[str] = None
    critical_system_access:bool = False

class T1SupplierRead(ORMModel):
    id:                    int
    template_id:           int
    supplier_name:         str
    service_description:   Optional[str]
    contract_status:       Optional[str]
    critical_system_access:bool


# =============================================================
# T2
# =============================================================

class T2DataCreate(BaseModel):
    zero_trust_mutual_auth:     bool = False
    zero_trust_segmentation:    bool = False
    zero_trust_least_privilege: bool = False
    circuit_breakers:           bool = False
    failover_configured:        bool = False
    drp_documented:             bool = False
    redundancy_configured:      bool = False
    backup_strategy_defined:    bool = False
    notes:                      Optional[str] = None

class T2DataRead(ORMModel):
    template_id:                int
    zero_trust_mutual_auth:     bool
    zero_trust_segmentation:    bool
    zero_trust_least_privilege: bool
    circuit_breakers:           bool
    failover_configured:        bool
    drp_documented:             bool
    redundancy_configured:      bool
    backup_strategy_defined:    bool
    notes:                      Optional[str]

class T2ThreatCreate(BaseModel):
    threat_ref:      str
    stride_category: str
    description:     str
    affected_asset:  Optional[str] = None
    risk_level:      Optional[str] = None
    mitigation:      Optional[str] = None
    test_ref:        Optional[str] = None

class T2ThreatRead(ORMModel):
    id:              int
    template_id:     int
    threat_ref:      str
    stride_category: str
    description:     str
    affected_asset:  Optional[str]
    risk_level:      Optional[str]
    mitigation:      Optional[str]
    test_ref:        Optional[str]

class T2ADRCreate(BaseModel):
    adr_ref:                str
    decision:               str
    context:                Optional[str] = None
    alternatives:           Optional[str] = None
    security_justification: Optional[str] = None
    dora_implications:      Optional[str] = None

class T2ADRApprove(BaseModel):
    approved_by: str  # Risk Manager name
    approved_at: str

class T2ADRRead(ORMModel):
    id:                     int
    template_id:            int
    adr_ref:                str
    decision:               str
    context:                Optional[str]
    alternatives:           Optional[str]
    security_justification: Optional[str]
    dora_implications:      Optional[str]
    risk_mgr_approved:      bool
    approved_at:            Optional[str]

class T2SupplierSLACreate(BaseModel):
    supplier_name:                str
    availability_sla:             Optional[str] = None
    incident_notification_clause: bool = False
    audit_rights:                 bool = False
    sla_status:                   Optional[str] = None

class T2SupplierSLARead(ORMModel):
    id:                           int
    template_id:                  int
    supplier_name:                str
    availability_sla:             Optional[str]
    incident_notification_clause: bool
    audit_rights:                 bool
    sla_status:                   Optional[str]


# =============================================================
# T3
# =============================================================

class T3DataCreate(BaseModel):
    owasp_guidelines_followed:    bool = False
    code_review_completed:        bool = False
    secrets_management_active:    bool = False
    input_validation_active:      bool = False
    auth_mechanisms_documented:   bool = False
    structured_logging_active:    bool = False
    audit_trail_auto_generated:   bool = False
    log_retention_7yr:            bool = False
    tamper_protection_active:     bool = False
    dependency_inventory_updated: bool = False
    supplier_access_monitored:    bool = False
    notes:                        Optional[str] = None

class T3DataRead(ORMModel):
    template_id:                  int
    owasp_guidelines_followed:    bool
    code_review_completed:        bool
    secrets_management_active:    bool
    input_validation_active:      bool
    auth_mechanisms_documented:   bool
    structured_logging_active:    bool
    audit_trail_auto_generated:   bool
    log_retention_7yr:            bool
    tamper_protection_active:     bool
    dependency_inventory_updated: bool
    supplier_access_monitored:    bool
    notes:                        Optional[str]

class T3PipelineScanCreate(BaseModel):
    scan_type:      str            # SAST | SCA | IAC | DAST
    pipeline_stage: Optional[str] = None  # BUILD | TEST | DEPLOY
    environment:    Optional[str] = None  # DEV | STAGING | PROD
    tool_used:      Optional[str] = None
    scan_date:      Optional[str] = None
    result:         str            # PASS | FAIL | NOT_RUN
    critical_vulns: int = 0
    report_ref:     Optional[str] = None

class T3PipelineScanRead(ORMModel):
    id:             int
    template_id:    int
    scan_type:      str
    pipeline_stage: Optional[str]
    environment:    Optional[str]
    tool_used:      Optional[str]
    scan_date:      Optional[str]
    result:         str
    critical_vulns: int
    report_ref:     Optional[str]

class T3DependencyCreate(BaseModel):
    package_name: str
    version:      Optional[str]  = None
    cve_id:       Optional[str]  = None
    cvss_score:   Optional[float]= None
    status:       Optional[str]  = None

class T3DependencyRead(ORMModel):
    id:           int
    template_id:  int
    package_name: str
    version:      Optional[str]
    cve_id:       Optional[str]
    cvss_score:   Optional[float]
    status:       Optional[str]


# =============================================================
# T4
# =============================================================

class T4DataCreate(BaseModel):
    tlpt_applicable:                bool = False
    tlpt_completed_or_scheduled:    bool = False
    tlpt_date:                      Optional[str] = None
    audit_trail_integrity_verified: bool = False
    incident_response_tested:       bool = False
    risk_assessments_validated:     bool = False
    notes:                          Optional[str] = None

class T4DataRead(ORMModel):
    template_id:                    int
    tlpt_applicable:                bool
    tlpt_completed_or_scheduled:    bool
    tlpt_date:                      Optional[str]
    audit_trail_integrity_verified: bool
    incident_response_tested:       bool
    risk_assessments_validated:     bool
    notes:                          Optional[str]

class T4SecurityTestCreate(BaseModel):
    test_ref:     str
    threat_ref:   Optional[str] = None
    description:  Optional[str] = None
    result:       str  # PASS | FAIL | NOT_RUN
    evidence_ref: Optional[str] = None

class T4SecurityTestRead(ORMModel):
    id:           int
    template_id:  int
    test_ref:     str
    threat_ref:   Optional[str]
    description:  Optional[str]
    result:       str
    evidence_ref: Optional[str]

class T4PenTestCreate(BaseModel):
    test_date:                 Optional[str] = None
    responsible_entity:        Optional[str] = None
    scope:                     Optional[str] = None
    critical_vulns_found:      int = 0
    critical_vulns_remediated: int = 0
    formal_report_ref:         Optional[str] = None
    status:                    Optional[str] = None

class T4PenTestRead(ORMModel):
    id:                        int
    template_id:               int
    test_date:                 Optional[str]
    responsible_entity:        Optional[str]
    scope:                     Optional[str]
    critical_vulns_found:      int
    critical_vulns_remediated: int
    formal_report_ref:         Optional[str]
    status:                    Optional[str]

class T4ResilienceTestCreate(BaseModel):
    test_type:    str  # DR | BCP | CHAOS_ENGINEERING | RTO_MEASUREMENT
    test_date:    Optional[str] = None
    rto_target:   Optional[str] = None
    rto_achieved: Optional[str] = None
    result:       Optional[str] = None
    notes:        Optional[str] = None

class T4ResilienceTestRead(ORMModel):
    id:           int
    template_id:  int
    test_type:    str
    test_date:    Optional[str]
    rto_target:   Optional[str]
    rto_achieved: Optional[str]
    result:       Optional[str]
    notes:        Optional[str]

class T4SupplierFailureSimCreate(BaseModel):
    supplier_name:         str
    scenario_description:  Optional[str] = None
    contingency_activated: bool = False
    result:                Optional[str] = None

class T4SupplierFailureSimRead(ORMModel):
    id:                    int
    template_id:           int
    supplier_name:         str
    scenario_description:  Optional[str]
    contingency_activated: bool
    result:                Optional[str]


# =============================================================
# T5
# =============================================================

class T5DataCreate(BaseModel):
    pre_deploy_security_validated:     bool = False
    system_hardening_completed:        bool = False
    secrets_rotated:                   bool = False
    post_deploy_scan_done:             bool = False
    rollback_plan_documented:          bool = False
    siem_active:                       bool = False
    infra_monitoring_rules_defined:    bool = False
    threat_intelligence_feeds_active:  bool = False
    continuous_vuln_assessment_active: bool = False
    incident_response_plan_active:     bool = False
    notification_4h_documented:        bool = False
    notification_4h_tested:            bool = False
    incident_classification_defined:   bool = False
    authority_contacts_identified:     bool = False
    post_mortem_process_defined:       bool = False
    notes:                             Optional[str] = None

class T5DataRead(ORMModel):
    template_id:                       int
    pre_deploy_security_validated:     bool
    system_hardening_completed:        bool
    secrets_rotated:                   bool
    post_deploy_scan_done:             bool
    rollback_plan_documented:          bool
    siem_active:                       bool
    infra_monitoring_rules_defined:    bool
    threat_intelligence_feeds_active:  bool
    continuous_vuln_assessment_active: bool
    incident_response_plan_active:     bool
    notification_4h_documented:        bool
    notification_4h_tested:            bool
    incident_classification_defined:   bool
    authority_contacts_identified:     bool
    post_mortem_process_defined:       bool
    notes:                             Optional[str]

class T5IncidentCreate(BaseModel):
    incident_ref:           str
    classification:         Optional[str] = None
    detected_at:            Optional[str] = None
    notified_at:            Optional[str] = None
    notification_within_4h: bool = False
    authority_notified:     Optional[str] = None
    post_mortem_completed:  bool = False
    status:                 Optional[str] = None

class T5IncidentRead(ORMModel):
    id:                     int
    template_id:            int
    incident_ref:           str
    classification:         Optional[str]
    detected_at:            Optional[str]
    notified_at:            Optional[str]
    notification_within_4h: bool
    authority_notified:     Optional[str]
    post_mortem_completed:  bool
    status:                 Optional[str]

class T5SupplierEvaluationCreate(BaseModel):
    supplier_name:     str
    last_review_date:  Optional[str] = None
    sla_met:           bool = False
    incidents_count:   int = 0
    evaluation_status: Optional[str] = None

class T5SupplierEvaluationRead(ORMModel):
    id:                int
    template_id:       int
    supplier_name:     str
    last_review_date:  Optional[str]
    sla_met:           bool
    incidents_count:   int
    evaluation_status: Optional[str]

class T5SharingAgreementCreate(BaseModel):
    agreement_name:            str
    ioc_sharing_active:        bool = False
    threat_intel_incorporated: bool = False
    authority_reporting_active:bool = False

class T5SharingAgreementRead(ORMModel):
    id:                        int
    template_id:               int
    agreement_name:            str
    ioc_sharing_active:        bool
    threat_intel_incorporated: bool
    authority_reporting_active:bool


# =============================================================
# DASHBOARD
# =============================================================

class EvidenceRead(ORMModel):
    id:          int
    template_id: int
    pillar:      str
    section:     str
    field_key:   str
    status:      str
    updated_at:  datetime

class EvidenceWithPhaseRead(BaseModel):
    id:            int
    template_id:   int
    pillar:        str
    section:       str
    field_key:     str
    status:        str
    updated_at:    datetime
    phase:         str
    sprint_number: Optional[int]

class AlertRead(ORMModel):
    id:          int
    project_id:  int
    template_id: Optional[int]
    pillar:      Optional[str]
    severity:    str
    rule_key:    str
    description: str
    created_at:  datetime
    resolved_at: Optional[str]

class ComplianceScoreRead(ORMModel):
    id:            int
    project_id:    int
    phase:         str
    pillar:        str
    score:         float
    calculated_at: datetime

class DashboardRead(BaseModel):
    project:           ProjectRead
    compliance_scores: List[ComplianceScoreRead]
    open_alerts:       List[AlertRead]
    evidence_summary:  dict  # {"COLLECTED": n, "INCOMPLETE": n, "MISSING": n, "NA": n}
