from fastapi import HTTPException
from sqlalchemy.orm import Session
from models import Project, Template
from services import evidence_tracker, alert_engine, compliance_calculator


def get_project_or_404(project_id: int, db: Session) -> Project:
    p = db.get(Project, project_id)
    if not p:
        raise HTTPException(404, "Projeto não encontrado")
    return p


def get_template_or_404(project_id: int, template_type: str,
                        sprint_number: int | None, db: Session) -> Template:
    t = (
        db.query(Template)
        .filter_by(project_id=project_id, type=template_type, sprint_number=sprint_number)
        .first()
    )
    if not t:
        raise HTTPException(404, f"Template {template_type} não encontrado")
    return t


def after_save(db: Session, template: Template, project: Project):
    """Refresh evidence, run alert rules and recalculate scores after any template write."""
    # Reload relationships so services see the latest data
    db.refresh(template)
    evidence_tracker.refresh(db, template, project)
    alert_engine.run(db, project, template)
    compliance_calculator.recalculate(db, project)
