from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Template, T5Data, T5Incident, T5SupplierEvaluation, T5SharingAgreement
from schemas import (
    TemplateRead, TemplateApprove,
    T5DataCreate, T5DataRead,
    T5IncidentCreate, T5IncidentRead,
    T5SupplierEvaluationCreate, T5SupplierEvaluationRead,
    T5SharingAgreementCreate, T5SharingAgreementRead,
)
from routers._helpers import get_project_or_404, get_template_or_404, after_save

router = APIRouter(prefix="/projects/{project_id}/t5", tags=["T5"])


def _t(project_id: int, sprint: int, db: Session) -> Template:
    return get_template_or_404(project_id, "T5", sprint, db)


# ------------------------------------------------------------------
# Template
# ------------------------------------------------------------------

@router.post("/", response_model=TemplateRead, status_code=201)
def create_t5(project_id: int, sprint_number: int, db: Session = Depends(get_db)):
    get_project_or_404(project_id, db)
    if db.query(Template).filter_by(project_id=project_id, type="T5", sprint_number=sprint_number).first():
        raise HTTPException(409, f"T5 para sprint {sprint_number} já existe")
    t = Template(project_id=project_id, type="T5", sprint_number=sprint_number, status="IN_PROGRESS")
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


@router.get("/", response_model=List[TemplateRead])
def list_t5(project_id: int, db: Session = Depends(get_db)):
    return db.query(Template).filter_by(project_id=project_id, type="T5").order_by(Template.sprint_number).all()


@router.get("/{sprint}", response_model=TemplateRead)
def get_t5(project_id: int, sprint: int, db: Session = Depends(get_db)):
    return _t(project_id, sprint, db)


@router.post("/{sprint}/approve", response_model=TemplateRead)
def approve_t5(project_id: int, sprint: int, body: TemplateApprove, db: Session = Depends(get_db)):
    project = get_project_or_404(project_id, db)
    t = _t(project_id, sprint, db)
    t.approved_by = body.approved_by
    t.approved_at = datetime.utcnow().isoformat()
    t.status = "COMPLETE"
    db.commit()
    after_save(db, t, project)
    db.refresh(t)
    return t


# ------------------------------------------------------------------
# Dados escalares
# ------------------------------------------------------------------

@router.put("/{sprint}/data", response_model=T5DataRead)
def upsert_data(project_id: int, sprint: int, body: T5DataCreate, db: Session = Depends(get_db)):
    project = get_project_or_404(project_id, db)
    t = _t(project_id, sprint, db)
    d = t.t5_data
    if d:
        for k, v in body.model_dump().items():
            setattr(d, k, v)
    else:
        d = T5Data(template_id=t.id, **body.model_dump())
        db.add(d)
    t.filled_at = datetime.utcnow().isoformat()
    db.commit()
    after_save(db, t, project)
    db.refresh(d)
    return d


@router.get("/{sprint}/data", response_model=T5DataRead)
def get_data(project_id: int, sprint: int, db: Session = Depends(get_db)):
    t = _t(project_id, sprint, db)
    if not t.t5_data:
        raise HTTPException(404, "Dados T5 ainda não preenchidos")
    return t.t5_data


# ------------------------------------------------------------------
# Incidentes [P2]
# ------------------------------------------------------------------

@router.get("/{sprint}/incidents", response_model=List[T5IncidentRead])
def list_incidents(project_id: int, sprint: int, db: Session = Depends(get_db)):
    return _t(project_id, sprint, db).t5_incidents


@router.post("/{sprint}/incidents", response_model=T5IncidentRead, status_code=201)
def add_incident(project_id: int, sprint: int, body: T5IncidentCreate, db: Session = Depends(get_db)):
    project = get_project_or_404(project_id, db)
    t = _t(project_id, sprint, db)
    inc = T5Incident(template_id=t.id, **body.model_dump())
    db.add(inc)
    db.commit()
    after_save(db, t, project)
    db.refresh(inc)
    return inc


@router.delete("/{sprint}/incidents/{inc_id}", status_code=204)
def delete_incident(project_id: int, sprint: int, inc_id: int, db: Session = Depends(get_db)):
    project = get_project_or_404(project_id, db)
    t = _t(project_id, sprint, db)
    inc = db.get(T5Incident, inc_id)
    if not inc or inc.template_id != t.id:
        raise HTTPException(404, "Incidente não encontrado")
    db.delete(inc)
    db.commit()
    after_save(db, t, project)


# ------------------------------------------------------------------
# Avaliações de fornecedores [P4]
# ------------------------------------------------------------------

@router.get("/{sprint}/supplier-evaluations", response_model=List[T5SupplierEvaluationRead])
def list_evals(project_id: int, sprint: int, db: Session = Depends(get_db)):
    return _t(project_id, sprint, db).t5_supplier_evaluations


@router.post("/{sprint}/supplier-evaluations", response_model=T5SupplierEvaluationRead, status_code=201)
def add_eval(project_id: int, sprint: int, body: T5SupplierEvaluationCreate, db: Session = Depends(get_db)):
    project = get_project_or_404(project_id, db)
    t = _t(project_id, sprint, db)
    ev = T5SupplierEvaluation(template_id=t.id, **body.model_dump())
    db.add(ev)
    db.commit()
    after_save(db, t, project)
    db.refresh(ev)
    return ev


@router.delete("/{sprint}/supplier-evaluations/{eval_id}", status_code=204)
def delete_eval(project_id: int, sprint: int, eval_id: int, db: Session = Depends(get_db)):
    project = get_project_or_404(project_id, db)
    t = _t(project_id, sprint, db)
    ev = db.get(T5SupplierEvaluation, eval_id)
    if not ev or ev.template_id != t.id:
        raise HTTPException(404, "Avaliação não encontrada")
    db.delete(ev)
    db.commit()
    after_save(db, t, project)


# ------------------------------------------------------------------
# Acordos de partilha de informação [P5]
# ------------------------------------------------------------------

@router.get("/{sprint}/sharing-agreements", response_model=List[T5SharingAgreementRead])
def list_agreements(project_id: int, sprint: int, db: Session = Depends(get_db)):
    return _t(project_id, sprint, db).t5_sharing_agreements


@router.post("/{sprint}/sharing-agreements", response_model=T5SharingAgreementRead, status_code=201)
def add_agreement(project_id: int, sprint: int, body: T5SharingAgreementCreate, db: Session = Depends(get_db)):
    project = get_project_or_404(project_id, db)
    t = _t(project_id, sprint, db)
    ag = T5SharingAgreement(template_id=t.id, **body.model_dump())
    db.add(ag)
    db.commit()
    after_save(db, t, project)
    db.refresh(ag)
    return ag


@router.delete("/{sprint}/sharing-agreements/{ag_id}", status_code=204)
def delete_agreement(project_id: int, sprint: int, ag_id: int, db: Session = Depends(get_db)):
    project = get_project_or_404(project_id, db)
    t = _t(project_id, sprint, db)
    ag = db.get(T5SharingAgreement, ag_id)
    if not ag or ag.template_id != t.id:
        raise HTTPException(404, "Acordo não encontrado")
    db.delete(ag)
    db.commit()
    after_save(db, t, project)
