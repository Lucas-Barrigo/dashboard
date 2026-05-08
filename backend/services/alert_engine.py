from datetime import datetime
from sqlalchemy.orm import Session
from models import Alert, Template, Project


def run(db: Session, project: Project, template: Template):
    fn = {
        "T1": _t1, "T2": _t2, "T3": _t3,
        "T4": _t4, "T5": _t5,
    }.get(template.type)
    if fn:
        fn(db, project, template)
        db.commit()


# =============================================================
# HELPERS
# =============================================================

def _raise_alert(db: Session, project_id: int, template_id: int,
                 pillar: str | None, severity: str, rule_key: str, description: str):
    existing = db.query(Alert).filter_by(
        project_id=project_id, template_id=template_id, rule_key=rule_key
    ).first()
    if existing:
        existing.resolved_at = None
    else:
        db.add(Alert(
            project_id=project_id,
            template_id=template_id,
            pillar=pillar,
            severity=severity,
            rule_key=rule_key,
            description=description,
        ))


def _resolve(db: Session, project_id: int, template_id: int, rule_key: str):
    alert = db.query(Alert).filter_by(
        project_id=project_id, template_id=template_id, rule_key=rule_key
    ).filter(Alert.resolved_at.is_(None)).first()
    if alert:
        alert.resolved_at = datetime.utcnow().isoformat()


# =============================================================
# REGRAS POR TEMPLATE
# =============================================================

def _t1(db: Session, p: Project, t: Template):
    # P4: supplier contracts pending
    if p.p4_active:
        for s in t.t1_suppliers:
            key = f"SUPPLIER_PENDING_{s.id}"
            if s.contract_status == "PENDING":
                _raise_alert(db, p.id, t.id, "P4", "WARNING", key,
                             f"Fornecedor '{s.supplier_name}' tem contrato pendente — due diligence em falta.")
            else:
                _resolve(db, p.id, t.id, key)

    # P2: incident response plan not finalised
    if p.p2_active:
        d = t.t1_data
        if d and not d.dora_impact_verified:
            _raise_alert(db, p.id, t.id, "P2", "CRITICAL", "P2_IMPACT_NOT_VERIFIED",
                         "Verificação de impacto DORA (Art. 5) não confirmada — avaliação de impacto obrigatória em falta.")
        else:
            _resolve(db, p.id, t.id, "P2_IMPACT_NOT_VERIFIED")

        if d and d.incident_response_plan_status not in ("COMPLETE",):
            _raise_alert(db, p.id, t.id, "P2", "WARNING", "P2_IRP_INCOMPLETE",
                         f"Plano de Resposta a Incidentes não finalizado (estado: {d.incident_response_plan_status or 'N/D'}) — requisito Art. 17.")
        else:
            _resolve(db, p.id, t.id, "P2_IRP_INCOMPLETE")

    # Riscos: OPEN sem mitigação = WARNING/CRITICAL; OPEN com mitigação = sem alerta
    for r in t.t1_risks:
        key = f"RISK_OPEN_{r.id}"
        if r.status in ("MITIGATED", "ACCEPTED", "CLOSED"):
            _resolve(db, p.id, t.id, key)
        elif r.status == "OPEN" and r.mitigation:
            _resolve(db, p.id, t.id, key)
        elif r.status == "OPEN" and not r.mitigation:
            severity = "CRITICAL" if r.impact == "HIGH" else "WARNING"
            _raise_alert(db, p.id, t.id, r.pillar, severity, key,
                         f"Risco '{r.risk_ref}' ({r.impact} impacto, pilar {r.pillar}) em aberto sem mitigação definida — requer tratamento (Art. 6 DORA).")


def _t2(db: Session, p: Project, t: Template):
    # P1: unapproved ADRs
    if p.p1_active:
        unapproved = [a for a in t.t2_adrs if not a.risk_mgr_approved]
        if unapproved:
            _raise_alert(db, p.id, t.id, "P1", "CRITICAL", "ADR_APPROVAL_MISSING",
                         f"{len(unapproved)} ADR(s) sem aprovação do Risk Manager — T2 não pode ser fechado.")
        else:
            _resolve(db, p.id, t.id, "ADR_APPROVAL_MISSING")

    # P2: no SLA agreements with third-party suppliers
    if p.p2_active:
        active_slas = [s for s in t.t2_supplier_slas if s.sla_status == "COLLECTED"]
        if not t.t2_supplier_slas:
            _raise_alert(db, p.id, t.id, "P2", "WARNING", "P2_NO_SUPPLIER_SLA",
                         "Nenhum SLA de fornecedor registado — cláusulas de notificação de incidentes obrigatórias (Art. 30).")
        elif not active_slas:
            _raise_alert(db, p.id, t.id, "P2", "WARNING", "P2_NO_SUPPLIER_SLA",
                         f"{len(t.t2_supplier_slas)} SLA(s) de fornecedor registado(s) mas nenhum em estado COLLECTED — rever cláusulas de notificação.")
        else:
            _resolve(db, p.id, t.id, "P2_NO_SUPPLIER_SLA")


def _t3(db: Session, p: Project, t: Template):
    if not p.p1_active:
        return

    # CVSS >= 7.0 por resolver
    critical = [s for s in t.t3_pipeline_scans if s.critical_vulns > 0]
    if critical:
        total = sum(s.critical_vulns for s in critical)
        _raise_alert(db, p.id, t.id, "P1", "CRITICAL", "CVSS_HIGH_UNRESOLVED",
                     f"{total} vulnerabilidade(s) CVSS ≥ 7.0 por resolver no pipeline CI/CD.")
    else:
        _resolve(db, p.id, t.id, "CVSS_HIGH_UNRESOLVED")

    # Nenhum scan registado
    if not t.t3_pipeline_scans:
        _raise_alert(db, p.id, t.id, "P1", "WARNING", "PIPELINE_SCAN_MISSING",
                     "Nenhum scan de segurança registado no pipeline CI/CD para este sprint.")
    else:
        _resolve(db, p.id, t.id, "PIPELINE_SCAN_MISSING")


def _t4(db: Session, p: Project, t: Template):
    d = t.t4_data

    # TLPT não agendado [P3]
    if p.p3_active and d and d.tlpt_applicable and not d.tlpt_completed_or_scheduled:
        _raise_alert(db, p.id, t.id, "P3", "CRITICAL", "TLPT_NOT_SCHEDULED",
                     "TLPT obrigatório (Art. 26) não está agendado nem concluído para este sistema crítico.")
    else:
        _resolve(db, p.id, t.id, "TLPT_NOT_SCHEDULED")

    # Nenhum teste de resiliência registado [P3]
    if p.p3_active:
        if not t.t4_resilience_tests:
            _raise_alert(db, p.id, t.id, "P3", "WARNING", "P3_NO_RESILIENCE_TESTS",
                         "Nenhum teste de resiliência (BCP/DR) registado — Art. 25 exige testes periódicos de resiliência operacional.")
        else:
            _resolve(db, p.id, t.id, "P3_NO_RESILIENCE_TESTS")

    # Vulnerabilidades críticas de pen test por remediar [P3]
    if p.p3_active:
        for pt in t.t4_pen_tests:
            key = f"PEN_TEST_CRITICAL_OPEN_{pt.id}"
            if pt.critical_vulns_found > pt.critical_vulns_remediated:
                open_count = pt.critical_vulns_found - pt.critical_vulns_remediated
                _raise_alert(db, p.id, t.id, "P3", "CRITICAL", key,
                             f"Pen test tem {open_count} vulnerabilidade(s) crítica(s) por remediar.")
            else:
                _resolve(db, p.id, t.id, key)


def _t5(db: Session, p: Project, t: Template):
    if p.p2_active:
        for inc in t.t5_incidents:
            key = f"INCIDENT_4H_VIOLATION_{inc.id}"
            if not inc.notification_within_4h:
                _raise_alert(db, p.id, t.id, "P2", "CRITICAL", key,
                             f"Incidente '{inc.incident_ref}' não notificado à autoridade dentro de 4 horas (Art. 19).")
            else:
                _resolve(db, p.id, t.id, key)

    # P4: fornecedores do T1 sem avaliação no T5
    if p.p4_active:
        t1_tmpl = db.query(Template).filter_by(
            project_id=p.id, type="T1", sprint_number=t.sprint_number
        ).first()
        if t1_tmpl:
            evaluated = {e.supplier_name.strip().lower() for e in t.t5_supplier_evaluations}
            for sup in t1_tmpl.t1_suppliers:
                key = f"T5_SUPPLIER_NOT_EVALUATED_{sup.id}"
                if sup.supplier_name.strip().lower() not in evaluated:
                    _raise_alert(db, p.id, t.id, "P4", "WARNING", key,
                                 f"Fornecedor '{sup.supplier_name}' (T1) sem avaliação operacional no T5 — requisito Art. 28 DORA.")
                else:
                    _resolve(db, p.id, t.id, key)
