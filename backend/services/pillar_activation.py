from sqlalchemy.orm import Session
from models import T0PillarAnswer, Project, Template

PILLARS = ("P1", "P2", "P3", "P4", "P5")


def activate_pillars(db: Session, project_id: int, t0_template_id: int) -> dict[str, bool]:
    """
    Lê as respostas do T0 e actualiza as flags de pilares activos no projecto.
    Um pilar é activado se pelo menos uma das suas perguntas tiver resposta True.
    """
    answers = (
        db.query(T0PillarAnswer)
        .filter(T0PillarAnswer.template_id == t0_template_id)
        .all()
    )

    active: dict[str, bool] = {p: False for p in PILLARS}
    for ans in answers:
        if ans.answer:
            active[ans.pillar] = True

    project = db.get(Project, project_id)
    project.p1_active = active["P1"]
    project.p2_active = active["P2"]
    project.p3_active = active["P3"]
    project.p4_active = active["P4"]
    project.p5_active = active["P5"]

    template = db.get(Template, t0_template_id)
    template.status = "COMPLETE"

    db.commit()
    return active
