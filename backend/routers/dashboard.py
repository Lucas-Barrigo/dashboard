from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from models import Alert, ComplianceScore, Evidence, Template
from schemas import AlertRead, ComplianceScoreRead, EvidenceRead, EvidenceWithPhaseRead, DashboardRead, ProjectRead
from routers._helpers import get_project_or_404
from pydantic import BaseModel

_PHASE_LABELS = {
    "T0": "Qualificação",
    "T1": "Planeamento",
    "T2": "Arquitetura",
    "T3": "Implementação",
    "T4": "Testes",
    "T5": "Operações",
}


class PhaseStatusRead(BaseModel):
    phase: str
    label: str
    status: Optional[str]
    locked: bool
    sprint_count: int

router = APIRouter(prefix="/projects/{project_id}/dashboard", tags=["dashboard"])


@router.get("/", response_model=DashboardRead)
def get_dashboard(project_id: int, db: Session = Depends(get_db)):
    project = get_project_or_404(project_id, db)

    scores = (
        db.query(ComplianceScore)
        .filter_by(project_id=project_id)
        .order_by(ComplianceScore.calculated_at.desc())
        .all()
    )

    open_alerts = (
        db.query(Alert)
        .filter_by(project_id=project_id)
        .filter(Alert.resolved_at.is_(None))
        .order_by(Alert.severity, Alert.created_at.desc())
        .all()
    )

    # Resumo de evidências
    t_ids = [t.id for t in db.query(Template).filter_by(project_id=project_id).all()]
    ev_all = db.query(Evidence).filter(Evidence.template_id.in_(t_ids)).all() if t_ids else []
    summary = {"COLLECTED": 0, "INCOMPLETE": 0, "MISSING": 0, "NA": 0}
    for e in ev_all:
        summary[e.status] = summary.get(e.status, 0) + 1

    return DashboardRead(
        project=ProjectRead.model_validate(project),
        compliance_scores=[ComplianceScoreRead.model_validate(s) for s in scores],
        open_alerts=[AlertRead.model_validate(a) for a in open_alerts],
        evidence_summary=summary,
    )


@router.get("/scores", response_model=List[ComplianceScoreRead])
def get_scores(project_id: int, db: Session = Depends(get_db)):
    get_project_or_404(project_id, db)
    return (
        db.query(ComplianceScore)
        .filter_by(project_id=project_id)
        .order_by(ComplianceScore.phase, ComplianceScore.pillar)
        .all()
    )


@router.get("/alerts", response_model=List[AlertRead])
def get_alerts(project_id: int, open_only: bool = True, db: Session = Depends(get_db)):
    get_project_or_404(project_id, db)
    q = db.query(Alert).filter_by(project_id=project_id)
    if open_only:
        q = q.filter(Alert.resolved_at.is_(None))
    return q.order_by(Alert.severity, Alert.created_at.desc()).all()


@router.get("/phases", response_model=List[PhaseStatusRead])
def get_phases(project_id: int, db: Session = Depends(get_db)):
    get_project_or_404(project_id, db)
    phases = ["T0", "T1", "T2", "T3", "T4", "T5"]
    result = []
    prev_complete = True

    for i, phase in enumerate(phases):
        templates = db.query(Template).filter_by(project_id=project_id, type=phase).all()
        if not templates:
            status = None
        elif any(t.status == "COMPLETE" for t in templates):
            status = "COMPLETE"
        else:
            status = "IN_PROGRESS"

        locked = not prev_complete
        result.append(PhaseStatusRead(
            phase=phase,
            label=_PHASE_LABELS[phase],
            status=status,
            locked=locked,
            sprint_count=len(templates),
        ))
        prev_complete = (status == "COMPLETE")

    return result


@router.get("/evidence", response_model=List[EvidenceWithPhaseRead])
def get_evidence(project_id: int, db: Session = Depends(get_db)):
    get_project_or_404(project_id, db)
    templates = {t.id: t for t in db.query(Template).filter_by(project_id=project_id).all()}
    if not templates:
        return []
    evidences = (
        db.query(Evidence)
        .filter(Evidence.template_id.in_(list(templates.keys())))
        .order_by(Evidence.pillar, Evidence.section)
        .all()
    )
    return [
        EvidenceWithPhaseRead(
            id=e.id,
            template_id=e.template_id,
            pillar=e.pillar,
            section=e.section,
            field_key=e.field_key,
            status=e.status,
            updated_at=e.updated_at,
            phase=templates[e.template_id].type,
            sprint_number=templates[e.template_id].sprint_number,
        )
        for e in evidences
    ]
