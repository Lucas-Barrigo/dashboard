from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Template, T0PillarAnswer, PillarQuestion
from schemas import (
    TemplateRead, TemplateApprove,
    T0SubmitAnswers, T0AnswerRead, PillarQuestionRead,
)
from routers._helpers import get_project_or_404, after_save
from services.pillar_activation import activate_pillars

router = APIRouter(prefix="/projects/{project_id}/t0", tags=["T0"])


def _get_or_404(project_id: int, db: Session) -> Template:
    t = db.query(Template).filter_by(project_id=project_id, type="T0").first()
    if not t:
        raise HTTPException(404, "T0 ainda não foi criado para este projeto")
    return t


# ------------------------------------------------------------------
# Perguntas de qualificação de pilares (dados estáticos)
# ------------------------------------------------------------------

@router.get("/questions", response_model=List[PillarQuestionRead], tags=["T0"])
def list_questions(db: Session = Depends(get_db)):
    return db.query(PillarQuestion).order_by(PillarQuestion.sort_order).all()


# ------------------------------------------------------------------
# Template T0
# ------------------------------------------------------------------

@router.post("/", response_model=TemplateRead, status_code=201)
def create_t0(project_id: int, db: Session = Depends(get_db)):
    project = get_project_or_404(project_id, db)
    if db.query(Template).filter_by(project_id=project_id, type="T0").first():
        raise HTTPException(409, "T0 já existe para este projeto")
    t = Template(project_id=project_id, type="T0", status="IN_PROGRESS")
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


@router.get("/", response_model=TemplateRead)
def get_t0(project_id: int, db: Session = Depends(get_db)):
    return _get_or_404(project_id, db)


# ------------------------------------------------------------------
# Respostas T0 → activa pilares
# ------------------------------------------------------------------

@router.post("/answers", response_model=List[T0AnswerRead])
def submit_answers(project_id: int, body: T0SubmitAnswers, db: Session = Depends(get_db)):
    project = get_project_or_404(project_id, db)
    template = _get_or_404(project_id, db)

    # Validar question_keys
    valid_keys = {q.question_key for q in db.query(PillarQuestion).all()}
    for ans in body.answers:
        if ans.question_key not in valid_keys:
            raise HTTPException(400, f"question_key inválido: {ans.question_key}")

    # Upsert respostas
    for ans in body.answers:
        q = db.query(PillarQuestion).get(ans.question_key)
        existing = db.query(T0PillarAnswer).filter_by(
            template_id=template.id, question_key=ans.question_key
        ).first()
        if existing:
            existing.answer = ans.answer
        else:
            db.add(T0PillarAnswer(
                template_id=template.id,
                pillar=q.pillar,
                question_key=ans.question_key,
                answer=ans.answer,
            ))

    if body.filled_by:
        template.filled_by = body.filled_by

    db.commit()

    # Activar pilares automaticamente após submissão completa
    activate_pillars(db, project_id, template.id)

    return db.query(T0PillarAnswer).filter_by(template_id=template.id).all()


@router.get("/answers", response_model=List[T0AnswerRead])
def get_answers(project_id: int, db: Session = Depends(get_db)):
    template = _get_or_404(project_id, db)
    return db.query(T0PillarAnswer).filter_by(template_id=template.id).all()


# ------------------------------------------------------------------
# Aprovação
# ------------------------------------------------------------------

@router.post("/approve", response_model=TemplateRead)
def approve_t0(project_id: int, body: TemplateApprove, db: Session = Depends(get_db)):
    template = _get_or_404(project_id, db)
    if template.status != "COMPLETE":
        raise HTTPException(400, "T0 tem de estar completo (todas as respostas submetidas) antes de ser aprovado")
    from datetime import datetime
    template.approved_by = body.approved_by
    template.approved_at = datetime.utcnow().isoformat()
    db.commit()
    db.refresh(template)
    return template
