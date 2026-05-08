from sqlalchemy.orm import Session
from models import Evidence, Template, Project, SectionExclusion


def _pillar_on(project: Project, pillar: str) -> bool:
    if pillar == "GENERAL":
        return True
    return bool(getattr(project, f"p{pillar[1]}_active", False))


def _upsert(db: Session, template_id: int, field_key: str, section: str, pillar: str, status: str):
    ev = db.query(Evidence).filter_by(template_id=template_id, field_key=field_key).first()
    if ev:
        ev.status = status
    else:
        db.add(Evidence(
            template_id=template_id,
            pillar=pillar,
            section=section,
            field_key=field_key,
            status=status,
        ))


def _put(db: Session, template_id: int, field_key: str, section: str, pillar: str,
         project: Project, collected: bool, excluded: frozenset = frozenset()):
    if section in excluded:
        _upsert(db, template_id, field_key, section, pillar, "NA")
    elif not _pillar_on(project, pillar):
        _upsert(db, template_id, field_key, section, pillar, "NA")
    elif collected:
        _upsert(db, template_id, field_key, section, pillar, "COLLECTED")
    else:
        _upsert(db, template_id, field_key, section, pillar, "MISSING")


# =============================================================
# REFRESH DISPATCHER
# =============================================================

def refresh(db: Session, template: Template, project: Project):
    excluded = frozenset(
        e.section_key for e in
        db.query(SectionExclusion).filter_by(template_id=template.id).all()
    )
    fn = {
        "T1": _t1, "T2": _t2, "T3": _t3,
        "T4": _t4, "T5": _t5,
    }.get(template.type)
    if fn:
        fn(db, template, project, excluded)
        db.commit()


# =============================================================
# T1
# =============================================================

def _t1(db: Session, t: Template, p: Project, excluded: frozenset):
    d = t.t1_data
    tid = t.id

    _put(db, tid, "dora_impact_verified",    "impact_check",     "GENERAL", p, bool(d and d.dora_impact_verified), excluded)
    _put(db, tid, "user_stories_documented", "user_stories",     "P1",      p, len(t.t1_user_stories) > 0, excluded)
    _put(db, tid, "risks_documented",        "risk_register",    "P1",      p, len(t.t1_risks) > 0, excluded)
    _put(db, tid, "incident_response_plan",  "incident_planning","P2",      p,
         bool(d and d.incident_response_plan_status == "ACTIVE"), excluded)
    _put(db, tid, "suppliers_documented",    "third_party",      "P4",      p, len(t.t1_suppliers) > 0, excluded)


# =============================================================
# T2
# =============================================================

def _t2(db: Session, t: Template, p: Project, excluded: frozenset):
    d = t.t2_data
    tid = t.id

    # Zero Trust [P1]
    for fk in ["zero_trust_mutual_auth", "zero_trust_segmentation", "zero_trust_least_privilege"]:
        _put(db, tid, fk, "zero_trust", "P1", p, bool(d and getattr(d, fk, False)), excluded)

    # Threat model [P1]
    _put(db, tid, "threats_documented", "threat_model", "P1", p, len(t.t2_threats) > 0, excluded)

    # ADRs [P1]
    _put(db, tid, "adrs_documented", "adrs", "P1", p, len(t.t2_adrs) > 0, excluded)
    if "adrs" in excluded or not _pillar_on(p, "P1"):
        _upsert(db, tid, "adrs_approved", "adrs", "P1", "NA")
    elif not t.t2_adrs:
        _upsert(db, tid, "adrs_approved", "adrs", "P1", "MISSING")
    elif all(a.risk_mgr_approved for a in t.t2_adrs):
        _upsert(db, tid, "adrs_approved", "adrs", "P1", "COLLECTED")
    else:
        _upsert(db, tid, "adrs_approved", "adrs", "P1", "INCOMPLETE")

    # Resiliência [P1 ou P2]
    resilience_on = _pillar_on(p, "P1") or _pillar_on(p, "P2")
    for fk in ["circuit_breakers", "failover_configured", "redundancy_configured", "backup_strategy_defined"]:
        if "resilience" in excluded or not resilience_on:
            _upsert(db, tid, fk, "resilience", "P1", "NA")
        else:
            _upsert(db, tid, fk, "resilience", "P1",
                    "COLLECTED" if bool(d and getattr(d, fk, False)) else "MISSING")
    _put(db, tid, "drp_documented", "resilience", "P2", p, bool(d and d.drp_documented), excluded)

    # SLAs [P4]
    _put(db, tid, "supplier_slas_documented", "supplier_slas", "P4", p, len(t.t2_supplier_slas) > 0, excluded)


# =============================================================
# T3
# =============================================================

def _t3(db: Session, t: Template, p: Project, excluded: frozenset):
    d = t.t3_data
    tid = t.id

    # Secure coding [P1]
    for fk in ["owasp_guidelines_followed", "code_review_completed", "secrets_management_active",
               "input_validation_active", "auth_mechanisms_documented"]:
        _put(db, tid, fk, "secure_coding", "P1", p, bool(d and getattr(d, fk, False)), excluded)

    # Pipeline [P1]
    _put(db, tid, "pipeline_scans_executed", "pipeline", "P1", p, len(t.t3_pipeline_scans) > 0, excluded)
    if "pipeline" in excluded or not _pillar_on(p, "P1"):
        _upsert(db, tid, "no_critical_vulns", "pipeline", "P1", "NA")
    elif not t.t3_pipeline_scans:
        _upsert(db, tid, "no_critical_vulns", "pipeline", "P1", "MISSING")
    elif all(s.critical_vulns == 0 for s in t.t3_pipeline_scans):
        _upsert(db, tid, "no_critical_vulns", "pipeline", "P1", "COLLECTED")
    else:
        _upsert(db, tid, "no_critical_vulns", "pipeline", "P1", "INCOMPLETE")

    # Logging [P1/P2]
    for fk in ["structured_logging_active", "audit_trail_auto_generated", "tamper_protection_active"]:
        _put(db, tid, fk, "logging", "P1", p, bool(d and getattr(d, fk, False)), excluded)
    _put(db, tid, "log_retention_7yr", "logging", "P2", p, bool(d and d.log_retention_7yr), excluded)

    # Dependências [P1]
    _put(db, tid, "dependency_inventory_updated", "dependencies", "P1", p,
         bool(d and d.dependency_inventory_updated), excluded)

    # Terceiros [P4]
    _put(db, tid, "supplier_access_monitored", "third_party", "P4", p,
         bool(d and d.supplier_access_monitored), excluded)

    # Sistemas TIC – capacidade e patches [P1] (Art. 7)
    _put(db, tid, "systems_capacity_assessed",  "systems_ict", "P1", p,
         bool(d and d.systems_capacity_assessed), excluded)
    _put(db, tid, "patches_applied_or_planned", "systems_ict", "P1", p,
         bool(d and d.patches_applied_or_planned), excluded)


# =============================================================
# T4
# =============================================================

def _t4(db: Session, t: Template, p: Project, excluded: frozenset):
    d = t.t4_data
    tid = t.id

    # Testes de segurança [P1]
    _put(db, tid, "security_tests_executed", "security_testing", "P1", p, len(t.t4_security_tests) > 0, excluded)
    if "security_testing" in excluded or not _pillar_on(p, "P1"):
        _upsert(db, tid, "security_tests_pass", "security_testing", "P1", "NA")
    elif not t.t4_security_tests:
        _upsert(db, tid, "security_tests_pass", "security_testing", "P1", "MISSING")
    elif all(s.result == "PASS" for s in t.t4_security_tests):
        _upsert(db, tid, "security_tests_pass", "security_testing", "P1", "COLLECTED")
    else:
        _upsert(db, tid, "security_tests_pass", "security_testing", "P1", "INCOMPLETE")

    # Pen testing [P3]
    _put(db, tid, "pen_test_executed", "pen_testing", "P3", p, len(t.t4_pen_tests) > 0, excluded)

    # TLPT [P3]
    if "tlpt" in excluded or not _pillar_on(p, "P3") or not (d and d.tlpt_applicable):
        _upsert(db, tid, "tlpt_scheduled",       "tlpt", "P3", "NA")
        _upsert(db, tid, "tlpt_tester_certified", "tlpt", "P3", "NA")
        _upsert(db, tid, "tlpt_tester_insured",   "tlpt", "P3", "NA")
    else:
        _upsert(db, tid, "tlpt_scheduled", "tlpt", "P3",
                "COLLECTED" if d.tlpt_completed_or_scheduled else "MISSING")
        _upsert(db, tid, "tlpt_tester_certified", "tlpt", "P3",
                "COLLECTED" if d.tlpt_tester_certified else "MISSING")
        _upsert(db, tid, "tlpt_tester_insured", "tlpt", "P3",
                "COLLECTED" if d.tlpt_tester_insured else "MISSING")

    # Resilience tests [P3]
    _put(db, tid, "resilience_tests_executed", "resilience_testing", "P3", p,
         len(t.t4_resilience_tests) > 0, excluded)

    # Supplier failure sims [P4]
    _put(db, tid, "supplier_failure_sims_executed", "supplier_testing", "P4", p,
         len(t.t4_supplier_failure_sims) > 0, excluded)

    # Exercícios cross-sector [P3] (Art. 49)
    _put(db, tid, "cross_sector_exercises_documented", "cross_sector", "P3", p,
         len(t.t4_cross_sector_exercises) > 0, excluded)

    # Verificação de conformidade [GENERAL]
    _put(db, tid, "audit_trail_integrity_verified", "compliance", "GENERAL", p,
         bool(d and d.audit_trail_integrity_verified), excluded)
    _put(db, tid, "incident_response_tested",       "compliance", "GENERAL", p,
         bool(d and d.incident_response_tested), excluded)
    _put(db, tid, "risk_assessments_validated",     "compliance", "GENERAL", p,
         bool(d and d.risk_assessments_validated), excluded)


# =============================================================
# T5
# =============================================================

def _t5(db: Session, t: Template, p: Project, excluded: frozenset):
    d = t.t5_data
    tid = t.id

    # Deployment [P1]
    for fk in ["pre_deploy_security_validated", "system_hardening_completed", "secrets_rotated",
               "post_deploy_scan_done", "rollback_plan_documented"]:
        _put(db, tid, fk, "deployment", "P1", p, bool(d and getattr(d, fk, False)), excluded)

    # Monitorização [P1]
    for fk in ["siem_active", "infra_monitoring_rules_defined",
               "threat_intelligence_feeds_active", "continuous_vuln_assessment_active"]:
        _put(db, tid, fk, "monitoring", "P1", p, bool(d and getattr(d, fk, False)), excluded)

    # Gestão de incidentes [P2]
    for fk in ["incident_response_plan_active", "notification_4h_documented", "notification_4h_tested",
               "incident_classification_defined", "authority_contacts_identified",
               "post_mortem_process_defined"]:
        _put(db, tid, fk, "incident_mgmt", "P2", p, bool(d and getattr(d, fk, False)), excluded)

    # Avaliações de fornecedores [P4]
    _put(db, tid, "supplier_evaluations_done", "supplier_eval", "P4", p,
         len(t.t5_supplier_evaluations) > 0, excluded)

    # Partilha de informação [P5]
    _put(db, tid, "sharing_agreements_active", "information_sharing", "P5", p,
         len(t.t5_sharing_agreements) > 0, excluded)

    # Sistemas TIC em produção – patches [P1] (Art. 7)
    _put(db, tid, "systems_patches_current", "systems_ict", "P1", p,
         bool(d and d.systems_patches_current), excluded)

    # Backup – restauro e segregação [P1] (Art. 12)
    _put(db, tid, "backup_restore_tested",     "backup", "P1", p,
         bool(d and d.backup_restore_tested), excluded)
    _put(db, tid, "backup_storage_segregated", "backup", "P1", p,
         bool(d and d.backup_storage_segregated), excluded)

    # Comunicação de crise [P2] (Art. 14)
    _put(db, tid, "crisis_comms_plan_tested", "crisis_comms", "P2", p,
         bool(d and d.crisis_comms_plan_tested), excluded)
