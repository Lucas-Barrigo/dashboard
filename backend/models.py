from datetime import datetime
from typing import Optional, List

from sqlalchemy import (
    Boolean, DateTime, Float, ForeignKey,
    Integer, String, Text, UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


# =============================================================
# PROJECTS
# =============================================================

class Project(Base):
    __tablename__ = "projects"

    id:                   Mapped[int]           = mapped_column(primary_key=True)
    name:                 Mapped[str]           = mapped_column(String, nullable=False)
    institution:          Mapped[str]           = mapped_column(String, nullable=False)
    responsible:          Mapped[str]           = mapped_column(String, nullable=False)
    sprint_duration_days: Mapped[int]           = mapped_column(Integer, default=14)
    criticality:          Mapped[Optional[str]] = mapped_column(String, nullable=True)
    p1_active:    Mapped[bool]          = mapped_column(Boolean, default=False)
    p2_active:    Mapped[bool]          = mapped_column(Boolean, default=False)
    p3_active:    Mapped[bool]          = mapped_column(Boolean, default=False)
    p4_active:    Mapped[bool]          = mapped_column(Boolean, default=False)
    p5_active:    Mapped[bool]          = mapped_column(Boolean, default=False)
    status:       Mapped[str]           = mapped_column(String, default="ACTIVE")
    created_at:   Mapped[datetime]      = mapped_column(DateTime, default=datetime.utcnow)
    updated_at:   Mapped[datetime]      = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    templates:         Mapped[List["Template"]]        = relationship(back_populates="project", cascade="all, delete-orphan")
    alerts:            Mapped[List["Alert"]]            = relationship(back_populates="project", cascade="all, delete-orphan")
    compliance_scores: Mapped[List["ComplianceScore"]] = relationship(back_populates="project", cascade="all, delete-orphan")


# =============================================================
# PILLAR QUESTIONS  (dados estáticos)
# =============================================================

class PillarQuestion(Base):
    __tablename__ = "pillar_questions"

    question_key:  Mapped[str] = mapped_column(String, primary_key=True)
    pillar:        Mapped[str] = mapped_column(String, nullable=False)
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    sort_order:    Mapped[int] = mapped_column(Integer, nullable=False)


# =============================================================
# TEMPLATES
# =============================================================

class Template(Base):
    __tablename__ = "templates"
    __table_args__ = (UniqueConstraint("project_id", "type", "sprint_number"),)

    id:            Mapped[int]           = mapped_column(primary_key=True)
    project_id:    Mapped[int]           = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    type:          Mapped[str]           = mapped_column(String, nullable=False)
    sprint_number: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    filled_by:     Mapped[Optional[str]] = mapped_column(String, nullable=True)
    filled_at:     Mapped[Optional[str]] = mapped_column(String, nullable=True)
    approved_by:   Mapped[Optional[str]] = mapped_column(String, nullable=True)
    approved_at:   Mapped[Optional[str]] = mapped_column(String, nullable=True)
    status:        Mapped[str]           = mapped_column(String, default="NOT_STARTED")
    created_at:    Mapped[datetime]      = mapped_column(DateTime, default=datetime.utcnow)
    updated_at:    Mapped[datetime]      = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project: Mapped["Project"] = relationship(back_populates="templates")

    t0_pillar_answers:       Mapped[List["T0PillarAnswer"]]      = relationship(back_populates="template", cascade="all, delete-orphan")
    t1_data:                 Mapped[Optional["T1Data"]]          = relationship(back_populates="template", cascade="all, delete-orphan", uselist=False)
    t1_user_stories:         Mapped[List["T1UserStory"]]         = relationship(back_populates="template", cascade="all, delete-orphan")
    t1_risks:                Mapped[List["T1Risk"]]              = relationship(back_populates="template", cascade="all, delete-orphan")
    t1_suppliers:            Mapped[List["T1Supplier"]]          = relationship(back_populates="template", cascade="all, delete-orphan")
    t2_data:                 Mapped[Optional["T2Data"]]          = relationship(back_populates="template", cascade="all, delete-orphan", uselist=False)
    t2_threats:              Mapped[List["T2Threat"]]            = relationship(back_populates="template", cascade="all, delete-orphan")
    t2_adrs:                 Mapped[List["T2ADR"]]               = relationship(back_populates="template", cascade="all, delete-orphan")
    t2_supplier_slas:        Mapped[List["T2SupplierSLA"]]       = relationship(back_populates="template", cascade="all, delete-orphan")
    t3_data:                 Mapped[Optional["T3Data"]]          = relationship(back_populates="template", cascade="all, delete-orphan", uselist=False)
    t3_pipeline_scans:       Mapped[List["T3PipelineScan"]]      = relationship(back_populates="template", cascade="all, delete-orphan")
    t3_dependencies:         Mapped[List["T3Dependency"]]        = relationship(back_populates="template", cascade="all, delete-orphan")
    t4_data:                 Mapped[Optional["T4Data"]]          = relationship(back_populates="template", cascade="all, delete-orphan", uselist=False)
    t4_security_tests:         Mapped[List["T4SecurityTest"]]        = relationship(back_populates="template", cascade="all, delete-orphan")
    t4_pen_tests:              Mapped[List["T4PenTest"]]             = relationship(back_populates="template", cascade="all, delete-orphan")
    t4_resilience_tests:       Mapped[List["T4ResilienceTest"]]      = relationship(back_populates="template", cascade="all, delete-orphan")
    t4_supplier_failure_sims:  Mapped[List["T4SupplierFailureSim"]]  = relationship(back_populates="template", cascade="all, delete-orphan")
    t4_cross_sector_exercises: Mapped[List["T4CrossSectorExercise"]] = relationship(back_populates="template", cascade="all, delete-orphan")
    t5_data:                 Mapped[Optional["T5Data"]]          = relationship(back_populates="template", cascade="all, delete-orphan", uselist=False)
    t5_incidents:            Mapped[List["T5Incident"]]          = relationship(back_populates="template", cascade="all, delete-orphan")
    t5_supplier_evaluations: Mapped[List["T5SupplierEvaluation"]]= relationship(back_populates="template", cascade="all, delete-orphan")
    t5_sharing_agreements:   Mapped[List["T5SharingAgreement"]]  = relationship(back_populates="template", cascade="all, delete-orphan")
    evidence:                Mapped[List["Evidence"]]            = relationship(back_populates="template", cascade="all, delete-orphan")
    section_exclusions:      Mapped[List["SectionExclusion"]]   = relationship(back_populates="template", cascade="all, delete-orphan")
    alerts:                  Mapped[List["Alert"]]               = relationship(back_populates="template")


# =============================================================
# T0
# =============================================================

class T0PillarAnswer(Base):
    __tablename__ = "t0_pillar_answers"
    __table_args__ = (UniqueConstraint("template_id", "question_key"),)

    id:           Mapped[int]  = mapped_column(primary_key=True)
    template_id:  Mapped[int]  = mapped_column(ForeignKey("templates.id", ondelete="CASCADE"), nullable=False)
    pillar:       Mapped[str]  = mapped_column(String, nullable=False)
    question_key: Mapped[str]  = mapped_column(String, nullable=False)
    answer:       Mapped[bool] = mapped_column(Boolean, nullable=False)

    template: Mapped["Template"] = relationship(back_populates="t0_pillar_answers")


# =============================================================
# T1
# =============================================================

class T1Data(Base):
    __tablename__ = "t1_data"

    template_id:                   Mapped[int]           = mapped_column(ForeignKey("templates.id", ondelete="CASCADE"), primary_key=True)
    incident_response_plan_status: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    dora_impact_verified:          Mapped[bool]          = mapped_column(Boolean, default=False)
    notes:                         Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    template: Mapped["Template"] = relationship(back_populates="t1_data")


class T1UserStory(Base):
    __tablename__ = "t1_user_stories"

    id:                       Mapped[int]           = mapped_column(primary_key=True)
    template_id:              Mapped[int]           = mapped_column(ForeignKey("templates.id", ondelete="CASCADE"), nullable=False)
    story_ref:                Mapped[str]           = mapped_column(String, nullable=False)
    description:              Mapped[str]           = mapped_column(Text, nullable=False)
    affects_critical_system:  Mapped[bool]          = mapped_column(Boolean, default=False)
    introduces_ict_risk:      Mapped[bool]          = mapped_column(Boolean, default=False)
    production_change:        Mapped[bool]          = mapped_column(Boolean, default=False)
    new_third_party:          Mapped[bool]          = mapped_column(Boolean, default=False)
    criteria_confidentiality: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    criteria_integrity:       Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    criteria_availability:    Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    template: Mapped["Template"] = relationship(back_populates="t1_user_stories")


class T1Risk(Base):
    __tablename__ = "t1_risks"

    id:          Mapped[int]           = mapped_column(primary_key=True)
    template_id: Mapped[int]           = mapped_column(ForeignKey("templates.id", ondelete="CASCADE"), nullable=False)
    risk_ref:    Mapped[str]           = mapped_column(String, nullable=False)
    description: Mapped[str]           = mapped_column(Text, nullable=False)
    probability: Mapped[str]           = mapped_column(String, nullable=False)
    impact:      Mapped[str]           = mapped_column(String, nullable=False)
    pillar:      Mapped[str]           = mapped_column(String, nullable=False)
    mitigation:              Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status:                  Mapped[str]           = mapped_column(String, default="OPEN")
    acceptance_justification: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    template: Mapped["Template"] = relationship(back_populates="t1_risks")


class T1Supplier(Base):
    __tablename__ = "t1_suppliers"

    id:                    Mapped[int]           = mapped_column(primary_key=True)
    template_id:           Mapped[int]           = mapped_column(ForeignKey("templates.id", ondelete="CASCADE"), nullable=False)
    supplier_name:         Mapped[str]           = mapped_column(String, nullable=False)
    service_description:   Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    contract_status:       Mapped[Optional[str]] = mapped_column(String, nullable=True)
    critical_system_access:Mapped[bool]          = mapped_column(Boolean, default=False)

    template: Mapped["Template"] = relationship(back_populates="t1_suppliers")


# =============================================================
# T2
# =============================================================

class T2Data(Base):
    __tablename__ = "t2_data"

    template_id:                Mapped[int]           = mapped_column(ForeignKey("templates.id", ondelete="CASCADE"), primary_key=True)
    zero_trust_mutual_auth:     Mapped[bool]          = mapped_column(Boolean, default=False)
    zero_trust_segmentation:    Mapped[bool]          = mapped_column(Boolean, default=False)
    zero_trust_least_privilege: Mapped[bool]          = mapped_column(Boolean, default=False)
    circuit_breakers:           Mapped[bool]          = mapped_column(Boolean, default=False)
    failover_configured:        Mapped[bool]          = mapped_column(Boolean, default=False)
    drp_documented:             Mapped[bool]          = mapped_column(Boolean, default=False)
    redundancy_configured:      Mapped[bool]          = mapped_column(Boolean, default=False)
    backup_strategy_defined:    Mapped[bool]          = mapped_column(Boolean, default=False)
    notes:                      Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    template: Mapped["Template"] = relationship(back_populates="t2_data")


class T2Threat(Base):
    __tablename__ = "t2_threats"

    id:              Mapped[int]           = mapped_column(primary_key=True)
    template_id:     Mapped[int]           = mapped_column(ForeignKey("templates.id", ondelete="CASCADE"), nullable=False)
    threat_ref:      Mapped[str]           = mapped_column(String, nullable=False)
    stride_category: Mapped[str]           = mapped_column(String, nullable=False)
    description:     Mapped[str]           = mapped_column(Text, nullable=False)
    affected_asset:  Mapped[Optional[str]] = mapped_column(String, nullable=True)
    risk_level:      Mapped[Optional[str]] = mapped_column(String, nullable=True)
    mitigation:      Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    template: Mapped["Template"] = relationship(back_populates="t2_threats")


class T2ADR(Base):
    __tablename__ = "t2_adrs"

    id:                     Mapped[int]           = mapped_column(primary_key=True)
    template_id:            Mapped[int]           = mapped_column(ForeignKey("templates.id", ondelete="CASCADE"), nullable=False)
    adr_ref:                Mapped[str]           = mapped_column(String, nullable=False)
    decision:               Mapped[str]           = mapped_column(Text, nullable=False)
    context:                Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    alternatives:           Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    security_justification: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    dora_implications:      Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    risk_mgr_approved:      Mapped[bool]          = mapped_column(Boolean, default=False)
    approved_at:            Mapped[Optional[str]] = mapped_column(String, nullable=True)

    template: Mapped["Template"] = relationship(back_populates="t2_adrs")


class T2SupplierSLA(Base):
    __tablename__ = "t2_supplier_slas"

    id:                           Mapped[int]           = mapped_column(primary_key=True)
    template_id:                  Mapped[int]           = mapped_column(ForeignKey("templates.id", ondelete="CASCADE"), nullable=False)
    supplier_name:                Mapped[str]           = mapped_column(String, nullable=False)
    availability_sla:             Mapped[Optional[str]] = mapped_column(String, nullable=True)
    incident_notification_clause: Mapped[bool]          = mapped_column(Boolean, default=False)
    audit_rights:                 Mapped[bool]          = mapped_column(Boolean, default=False)
    sla_status:                   Mapped[Optional[str]] = mapped_column(String, nullable=True)

    template: Mapped["Template"] = relationship(back_populates="t2_supplier_slas")


# =============================================================
# T3
# =============================================================

class T3Data(Base):
    __tablename__ = "t3_data"

    template_id:                  Mapped[int]           = mapped_column(ForeignKey("templates.id", ondelete="CASCADE"), primary_key=True)
    owasp_guidelines_followed:    Mapped[bool]          = mapped_column(Boolean, default=False)
    code_review_completed:        Mapped[bool]          = mapped_column(Boolean, default=False)
    secrets_management_active:    Mapped[bool]          = mapped_column(Boolean, default=False)
    input_validation_active:      Mapped[bool]          = mapped_column(Boolean, default=False)
    auth_mechanisms_documented:   Mapped[bool]          = mapped_column(Boolean, default=False)
    structured_logging_active:    Mapped[bool]          = mapped_column(Boolean, default=False)
    audit_trail_auto_generated:   Mapped[bool]          = mapped_column(Boolean, default=False)
    log_retention_7yr:            Mapped[bool]          = mapped_column(Boolean, default=False)
    tamper_protection_active:     Mapped[bool]          = mapped_column(Boolean, default=False)
    dependency_inventory_updated: Mapped[bool]          = mapped_column(Boolean, default=False)
    supplier_access_monitored:    Mapped[bool]          = mapped_column(Boolean, default=False)
    systems_capacity_assessed:    Mapped[bool]          = mapped_column(Boolean, default=False)
    patches_applied_or_planned:   Mapped[bool]          = mapped_column(Boolean, default=False)
    notes:                        Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    template: Mapped["Template"] = relationship(back_populates="t3_data")


class T3PipelineScan(Base):
    __tablename__ = "t3_pipeline_scans"

    id:             Mapped[int]           = mapped_column(primary_key=True)
    template_id:    Mapped[int]           = mapped_column(ForeignKey("templates.id", ondelete="CASCADE"), nullable=False)
    scan_type:      Mapped[str]           = mapped_column(String, nullable=False)
    pipeline_stage: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    environment:    Mapped[Optional[str]] = mapped_column(String, nullable=True)
    tool_used:      Mapped[Optional[str]] = mapped_column(String, nullable=True)
    scan_date:      Mapped[Optional[str]] = mapped_column(String, nullable=True)
    result:         Mapped[str]           = mapped_column(String, nullable=False)
    critical_vulns: Mapped[int]           = mapped_column(Integer, default=0)
    report_ref:     Mapped[Optional[str]] = mapped_column(String, nullable=True)

    template: Mapped["Template"] = relationship(back_populates="t3_pipeline_scans")


class T3Dependency(Base):
    __tablename__ = "t3_dependencies"

    id:           Mapped[int]            = mapped_column(primary_key=True)
    template_id:  Mapped[int]            = mapped_column(ForeignKey("templates.id", ondelete="CASCADE"), nullable=False)
    package_name: Mapped[str]            = mapped_column(String, nullable=False)
    version:      Mapped[Optional[str]]  = mapped_column(String, nullable=True)
    cve_id:       Mapped[Optional[str]]  = mapped_column(String, nullable=True)
    cvss_score:   Mapped[Optional[float]]= mapped_column(Float, nullable=True)
    status:       Mapped[Optional[str]]  = mapped_column(String, nullable=True)

    template: Mapped["Template"] = relationship(back_populates="t3_dependencies")


# =============================================================
# T4
# =============================================================

class T4Data(Base):
    __tablename__ = "t4_data"

    template_id:                    Mapped[int]           = mapped_column(ForeignKey("templates.id", ondelete="CASCADE"), primary_key=True)
    tlpt_applicable:                Mapped[bool]          = mapped_column(Boolean, default=False)
    tlpt_completed_or_scheduled:    Mapped[bool]          = mapped_column(Boolean, default=False)
    tlpt_date:                      Mapped[Optional[str]] = mapped_column(String, nullable=True)
    audit_trail_integrity_verified: Mapped[bool]          = mapped_column(Boolean, default=False)
    incident_response_tested:       Mapped[bool]          = mapped_column(Boolean, default=False)
    risk_assessments_validated:     Mapped[bool]          = mapped_column(Boolean, default=False)
    tlpt_tester_certified:          Mapped[bool]          = mapped_column(Boolean, default=False)
    tlpt_tester_insured:            Mapped[bool]          = mapped_column(Boolean, default=False)
    notes:                          Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    template: Mapped["Template"] = relationship(back_populates="t4_data")


class T4SecurityTest(Base):
    __tablename__ = "t4_security_tests"

    id:           Mapped[int]           = mapped_column(primary_key=True)
    template_id:  Mapped[int]           = mapped_column(ForeignKey("templates.id", ondelete="CASCADE"), nullable=False)
    test_ref:     Mapped[str]           = mapped_column(String, nullable=False)
    threat_ref:   Mapped[Optional[str]] = mapped_column(String, nullable=True)
    description:  Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    result:       Mapped[str]           = mapped_column(String, nullable=False)
    evidence_ref: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    template: Mapped["Template"] = relationship(back_populates="t4_security_tests")


class T4PenTest(Base):
    __tablename__ = "t4_pen_tests"

    id:                        Mapped[int]           = mapped_column(primary_key=True)
    template_id:               Mapped[int]           = mapped_column(ForeignKey("templates.id", ondelete="CASCADE"), nullable=False)
    test_date:                 Mapped[Optional[str]] = mapped_column(String, nullable=True)
    responsible_entity:        Mapped[Optional[str]] = mapped_column(String, nullable=True)
    scope:                     Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    critical_vulns_found:      Mapped[int]           = mapped_column(Integer, default=0)
    critical_vulns_remediated: Mapped[int]           = mapped_column(Integer, default=0)
    formal_report_ref:         Mapped[Optional[str]] = mapped_column(String, nullable=True)
    status:                    Mapped[Optional[str]] = mapped_column(String, nullable=True)

    template: Mapped["Template"] = relationship(back_populates="t4_pen_tests")


class T4ResilienceTest(Base):
    __tablename__ = "t4_resilience_tests"

    id:           Mapped[int]           = mapped_column(primary_key=True)
    template_id:  Mapped[int]           = mapped_column(ForeignKey("templates.id", ondelete="CASCADE"), nullable=False)
    test_type:    Mapped[str]           = mapped_column(String, nullable=False)
    test_date:    Mapped[Optional[str]] = mapped_column(String, nullable=True)
    rto_target:   Mapped[Optional[str]] = mapped_column(String, nullable=True)
    rto_achieved: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    result:       Mapped[Optional[str]] = mapped_column(String, nullable=True)
    notes:        Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    template: Mapped["Template"] = relationship(back_populates="t4_resilience_tests")


class T4CrossSectorExercise(Base):
    __tablename__ = "t4_cross_sector_exercises"

    id:                 Mapped[int]           = mapped_column(primary_key=True)
    template_id:        Mapped[int]           = mapped_column(ForeignKey("templates.id", ondelete="CASCADE"), nullable=False)
    exercise_name:      Mapped[str]           = mapped_column(String, nullable=False)
    exercise_date:      Mapped[Optional[str]] = mapped_column(String, nullable=True)
    organized_by:       Mapped[Optional[str]] = mapped_column(String, nullable=True)
    participation_type: Mapped[str]           = mapped_column(String, nullable=False, default="PARTICIPANT")
    scenario_type:      Mapped[Optional[str]] = mapped_column(String, nullable=True)
    outcome:            Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    template: Mapped["Template"] = relationship(back_populates="t4_cross_sector_exercises")


class T4SupplierFailureSim(Base):
    __tablename__ = "t4_supplier_failure_sims"

    id:                    Mapped[int]           = mapped_column(primary_key=True)
    template_id:           Mapped[int]           = mapped_column(ForeignKey("templates.id", ondelete="CASCADE"), nullable=False)
    supplier_name:         Mapped[str]           = mapped_column(String, nullable=False)
    scenario_description:  Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    contingency_activated: Mapped[bool]          = mapped_column(Boolean, default=False)
    result:                Mapped[Optional[str]] = mapped_column(String, nullable=True)

    template: Mapped["Template"] = relationship(back_populates="t4_supplier_failure_sims")


# =============================================================
# T5
# =============================================================

class T5Data(Base):
    __tablename__ = "t5_data"

    template_id:                       Mapped[int]           = mapped_column(ForeignKey("templates.id", ondelete="CASCADE"), primary_key=True)
    pre_deploy_security_validated:     Mapped[bool]          = mapped_column(Boolean, default=False)
    system_hardening_completed:        Mapped[bool]          = mapped_column(Boolean, default=False)
    secrets_rotated:                   Mapped[bool]          = mapped_column(Boolean, default=False)
    post_deploy_scan_done:             Mapped[bool]          = mapped_column(Boolean, default=False)
    rollback_plan_documented:          Mapped[bool]          = mapped_column(Boolean, default=False)
    siem_active:                       Mapped[bool]          = mapped_column(Boolean, default=False)
    infra_monitoring_rules_defined:    Mapped[bool]          = mapped_column(Boolean, default=False)
    threat_intelligence_feeds_active:  Mapped[bool]          = mapped_column(Boolean, default=False)
    continuous_vuln_assessment_active: Mapped[bool]          = mapped_column(Boolean, default=False)
    incident_response_plan_active:     Mapped[bool]          = mapped_column(Boolean, default=False)
    notification_4h_documented:        Mapped[bool]          = mapped_column(Boolean, default=False)
    notification_4h_tested:            Mapped[bool]          = mapped_column(Boolean, default=False)
    incident_classification_defined:   Mapped[bool]          = mapped_column(Boolean, default=False)
    authority_contacts_identified:     Mapped[bool]          = mapped_column(Boolean, default=False)
    post_mortem_process_defined:       Mapped[bool]          = mapped_column(Boolean, default=False)
    systems_patches_current:           Mapped[bool]          = mapped_column(Boolean, default=False)
    backup_restore_tested:             Mapped[bool]          = mapped_column(Boolean, default=False)
    backup_storage_segregated:         Mapped[bool]          = mapped_column(Boolean, default=False)
    crisis_comms_plan_tested:          Mapped[bool]          = mapped_column(Boolean, default=False)
    notes:                             Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    template: Mapped["Template"] = relationship(back_populates="t5_data")


class T5Incident(Base):
    __tablename__ = "t5_incidents"

    id:                     Mapped[int]           = mapped_column(primary_key=True)
    template_id:            Mapped[int]           = mapped_column(ForeignKey("templates.id", ondelete="CASCADE"), nullable=False)
    incident_ref:           Mapped[str]           = mapped_column(String, nullable=False)
    classification:         Mapped[Optional[str]] = mapped_column(String, nullable=True)
    detected_at:            Mapped[Optional[str]] = mapped_column(String, nullable=True)
    notified_at:            Mapped[Optional[str]] = mapped_column(String, nullable=True)
    notification_within_4h: Mapped[bool]          = mapped_column(Boolean, default=False)
    authority_notified:     Mapped[Optional[str]] = mapped_column(String, nullable=True)
    post_mortem_completed:  Mapped[bool]          = mapped_column(Boolean, default=False)
    status:                 Mapped[Optional[str]] = mapped_column(String, nullable=True)

    template: Mapped["Template"] = relationship(back_populates="t5_incidents")


class T5SupplierEvaluation(Base):
    __tablename__ = "t5_supplier_evaluations"

    id:                Mapped[int]           = mapped_column(primary_key=True)
    template_id:       Mapped[int]           = mapped_column(ForeignKey("templates.id", ondelete="CASCADE"), nullable=False)
    supplier_name:     Mapped[str]           = mapped_column(String, nullable=False)
    last_review_date:  Mapped[Optional[str]] = mapped_column(String, nullable=True)
    sla_met:           Mapped[bool]          = mapped_column(Boolean, default=False)
    incidents_count:   Mapped[int]           = mapped_column(Integer, default=0)
    evaluation_status: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    template: Mapped["Template"] = relationship(back_populates="t5_supplier_evaluations")


class T5SharingAgreement(Base):
    __tablename__ = "t5_sharing_agreements"

    id:                        Mapped[int]  = mapped_column(primary_key=True)
    template_id:               Mapped[int]  = mapped_column(ForeignKey("templates.id", ondelete="CASCADE"), nullable=False)
    agreement_name:            Mapped[str]  = mapped_column(String, nullable=False)
    ioc_sharing_active:        Mapped[bool] = mapped_column(Boolean, default=False)
    threat_intel_incorporated: Mapped[bool] = mapped_column(Boolean, default=False)
    authority_reporting_active:Mapped[bool] = mapped_column(Boolean, default=False)

    template: Mapped["Template"] = relationship(back_populates="t5_sharing_agreements")


# =============================================================
# DASHBOARD
# =============================================================

class Evidence(Base):
    __tablename__ = "evidence"
    __table_args__ = (UniqueConstraint("template_id", "field_key"),)

    id:          Mapped[int]      = mapped_column(primary_key=True)
    template_id: Mapped[int]      = mapped_column(ForeignKey("templates.id", ondelete="CASCADE"), nullable=False)
    pillar:      Mapped[str]      = mapped_column(String, nullable=False)
    section:     Mapped[str]      = mapped_column(String, nullable=False)
    field_key:   Mapped[str]      = mapped_column(String, nullable=False)
    status:      Mapped[str]      = mapped_column(String, default="MISSING")
    updated_at:  Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    template: Mapped["Template"] = relationship(back_populates="evidence")


class SectionExclusion(Base):
    __tablename__ = "section_exclusions"
    __table_args__ = (UniqueConstraint("template_id", "section_key"),)

    id:            Mapped[int]      = mapped_column(primary_key=True)
    template_id:   Mapped[int]      = mapped_column(ForeignKey("templates.id", ondelete="CASCADE"), nullable=False)
    section_key:   Mapped[str]      = mapped_column(String, nullable=False)
    justification: Mapped[str]      = mapped_column(Text, nullable=False)
    marked_at:     Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    template: Mapped["Template"] = relationship(back_populates="section_exclusions")


class Alert(Base):
    __tablename__ = "alerts"

    id:          Mapped[int]           = mapped_column(primary_key=True)
    project_id:  Mapped[int]           = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    template_id: Mapped[Optional[int]] = mapped_column(ForeignKey("templates.id", ondelete="SET NULL"), nullable=True)
    pillar:      Mapped[Optional[str]] = mapped_column(String, nullable=True)
    severity:    Mapped[str]           = mapped_column(String, nullable=False)
    rule_key:    Mapped[str]           = mapped_column(String, nullable=False)
    description: Mapped[str]           = mapped_column(Text, nullable=False)
    created_at:  Mapped[datetime]      = mapped_column(DateTime, default=datetime.utcnow)
    resolved_at: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    project:  Mapped["Project"]           = relationship(back_populates="alerts")
    template: Mapped[Optional["Template"]]= relationship(back_populates="alerts")


class ComplianceScore(Base):
    __tablename__ = "compliance_scores"

    id:            Mapped[int]      = mapped_column(primary_key=True)
    project_id:    Mapped[int]      = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    phase:         Mapped[str]      = mapped_column(String, nullable=False)
    pillar:        Mapped[str]      = mapped_column(String, nullable=False)
    score:         Mapped[float]    = mapped_column(Float, nullable=False)
    calculated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    project: Mapped["Project"] = relationship(back_populates="compliance_scores")
