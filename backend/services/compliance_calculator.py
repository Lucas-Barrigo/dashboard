from datetime import datetime
from sqlalchemy.orm import Session
from models import Project, Template, Evidence, ComplianceScore

PHASES  = ("T0", "T1", "T2", "T3", "T4", "T5")
PILLARS = ("P1", "P2", "P3", "P4", "P5")


def recalculate(db: Session, project: Project):
    """
    Recalcula todos os scores de conformidade para um projecto.
    Score = (evidências COLLECTED) / (evidências não-NA) × 100
    """
    db.query(ComplianceScore).filter_by(project_id=project.id).delete()

    templates = db.query(Template).filter_by(project_id=project.id).all()
    if not templates:
        db.commit()
        return

    t_ids = [t.id for t in templates]
    all_ev = db.query(Evidence).filter(Evidence.template_id.in_(t_ids)).all()

    for phase in PHASES:
        phase_ids = {t.id for t in templates if t.type == phase}
        phase_ev  = [e for e in all_ev if e.template_id in phase_ids]
        if not phase_ev:
            continue

        # Score por pilar
        for pillar in PILLARS:
            pil_ev = [e for e in phase_ev if e.pillar == pillar]
            applicable = [e for e in pil_ev if e.status != "NA"]
            if not applicable:
                continue
            collected = sum(1 for e in applicable if e.status == "COLLECTED")
            _add(db, project.id, phase, pillar, collected / len(applicable) * 100)

        # Score global da fase
        applicable = [e for e in phase_ev if e.status != "NA"]
        if applicable:
            collected = sum(1 for e in applicable if e.status == "COLLECTED")
            _add(db, project.id, phase, "ALL", collected / len(applicable) * 100)

    # Score global do projecto
    applicable = [e for e in all_ev if e.status != "NA"]
    if applicable:
        collected = sum(1 for e in applicable if e.status == "COLLECTED")
        _add(db, project.id, "GLOBAL", "ALL", collected / len(applicable) * 100)

    db.commit()


def _add(db: Session, project_id: int, phase: str, pillar: str, score: float):
    db.add(ComplianceScore(
        project_id=project_id,
        phase=phase,
        pillar=pillar,
        score=round(score, 1),
        calculated_at=datetime.utcnow(),
    ))
