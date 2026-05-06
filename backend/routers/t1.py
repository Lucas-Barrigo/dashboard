from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Template, T1Data, T1UserStory, T1Risk, T1Supplier
from schemas import (
    TemplateRead, TemplateApprove,
    T1DataCreate, T1DataRead,
    T1UserStoryCreate, T1UserStoryRead,
    T1RiskCreate, T1RiskRead,
    T1SupplierCreate, T1SupplierRead,
)
from routers._helpers import get_project_or_404, get_template_or_404, after_save

router = APIRouter(prefix="/projects/{project_id}/t1", tags=["T1"])


def _t(project_id: int, sprint: int, db: Session) -> Template:
    return get_template_or_404(project_id, "T1", sprint, db)


# ------------------------------------------------------------------
# Template
# ------------------------------------------------------------------

@router.post("/", response_model=TemplateRead, status_code=201)
def create_t1(project_id: int, sprint_number: int, db: Session = Depends(get_db)):
    get_project_or_404(project_id, db)
    if db.query(Template).filter_by(project_id=project_id, type="T1", sprint_number=sprint_number).first():
        raise HTTPException(409, f"T1 para sprint {sprint_number} já existe")
    t = Template(project_id=project_id, type="T1", sprint_number=sprint_number, status="IN_PROGRESS")
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


@router.get("/", response_model=List[TemplateRead])
def list_t1(project_id: int, db: Session = Depends(get_db)):
    return db.query(Template).filter_by(project_id=project_id, type="T1").order_by(Template.sprint_number).all()


@router.get("/{sprint}", response_model=TemplateRead)
def get_t1(project_id: int, sprint: int, db: Session = Depends(get_db)):
    return _t(project_id, sprint, db)


@router.post("/{sprint}/approve", response_model=TemplateRead)
def approve_t1(project_id: int, sprint: int, body: TemplateApprove, db: Session = Depends(get_db)):
    t = _t(project_id, sprint, db)
    t.approved_by = body.approved_by
    t.approved_at = datetime.utcnow().isoformat()
    t.status = "COMPLETE"
    db.commit()
    db.refresh(t)
    return t


# ------------------------------------------------------------------
# Dados escalares
# ------------------------------------------------------------------

@router.put("/{sprint}/data", response_model=T1DataRead)
def upsert_data(project_id: int, sprint: int, body: T1DataCreate, db: Session = Depends(get_db)):
    project = get_project_or_404(project_id, db)
    t = _t(project_id, sprint, db)
    d = t.t1_data
    if d:
        for k, v in body.model_dump().items():
            setattr(d, k, v)
    else:
        d = T1Data(template_id=t.id, **body.model_dump())
        db.add(d)
    t.filled_at = datetime.utcnow().isoformat()
    db.commit()
    after_save(db, t, project)
    db.refresh(d)
    return d


@router.get("/{sprint}/data", response_model=T1DataRead)
def get_data(project_id: int, sprint: int, db: Session = Depends(get_db)):
    t = _t(project_id, sprint, db)
    if not t.t1_data:
        raise HTTPException(404, "Dados T1 ainda não preenchidos")
    return t.t1_data


# ------------------------------------------------------------------
# User Stories
# ------------------------------------------------------------------

@router.get("/{sprint}/stories", response_model=List[T1UserStoryRead])
def list_stories(project_id: int, sprint: int, db: Session = Depends(get_db)):
    t = _t(project_id, sprint, db)
    return t.t1_user_stories


@router.post("/{sprint}/stories", response_model=T1UserStoryRead, status_code=201)
def add_story(project_id: int, sprint: int, body: T1UserStoryCreate, db: Session = Depends(get_db)):
    project = get_project_or_404(project_id, db)
    t = _t(project_id, sprint, db)
    s = T1UserStory(template_id=t.id, **body.model_dump())
    db.add(s)
    db.commit()
    after_save(db, t, project)
    db.refresh(s)
    return s


@router.delete("/{sprint}/stories/{story_id}", status_code=204)
def delete_story(project_id: int, sprint: int, story_id: int, db: Session = Depends(get_db)):
    project = get_project_or_404(project_id, db)
    t = _t(project_id, sprint, db)
    s = db.get(T1UserStory, story_id)
    if not s or s.template_id != t.id:
        raise HTTPException(404, "User Story não encontrada")
    db.delete(s)
    db.commit()
    after_save(db, t, project)


# ------------------------------------------------------------------
# Riscos ICT
# ------------------------------------------------------------------

@router.get("/{sprint}/risks", response_model=List[T1RiskRead])
def list_risks(project_id: int, sprint: int, db: Session = Depends(get_db)):
    return _t(project_id, sprint, db).t1_risks


@router.post("/{sprint}/risks", response_model=T1RiskRead, status_code=201)
def add_risk(project_id: int, sprint: int, body: T1RiskCreate, db: Session = Depends(get_db)):
    project = get_project_or_404(project_id, db)
    t = _t(project_id, sprint, db)
    r = T1Risk(template_id=t.id, **body.model_dump())
    db.add(r)
    db.commit()
    after_save(db, t, project)
    db.refresh(r)
    return r


@router.put("/{sprint}/risks/{risk_id}", response_model=T1RiskRead)
def update_risk(project_id: int, sprint: int, risk_id: int, body: T1RiskCreate, db: Session = Depends(get_db)):
    project = get_project_or_404(project_id, db)
    t = _t(project_id, sprint, db)
    r = db.get(T1Risk, risk_id)
    if not r or r.template_id != t.id:
        raise HTTPException(404, "Risco não encontrado")
    for k, v in body.model_dump().items():
        setattr(r, k, v)
    db.commit()
    after_save(db, t, project)
    db.refresh(r)
    return r


@router.delete("/{sprint}/risks/{risk_id}", status_code=204)
def delete_risk(project_id: int, sprint: int, risk_id: int, db: Session = Depends(get_db)):
    project = get_project_or_404(project_id, db)
    t = _t(project_id, sprint, db)
    r = db.get(T1Risk, risk_id)
    if not r or r.template_id != t.id:
        raise HTTPException(404, "Risco não encontrado")
    db.delete(r)
    db.commit()
    after_save(db, t, project)


# ------------------------------------------------------------------
# Fornecedores
# ------------------------------------------------------------------

@router.get("/{sprint}/suppliers", response_model=List[T1SupplierRead])
def list_suppliers(project_id: int, sprint: int, db: Session = Depends(get_db)):
    return _t(project_id, sprint, db).t1_suppliers


@router.post("/{sprint}/suppliers", response_model=T1SupplierRead, status_code=201)
def add_supplier(project_id: int, sprint: int, body: T1SupplierCreate, db: Session = Depends(get_db)):
    project = get_project_or_404(project_id, db)
    t = _t(project_id, sprint, db)
    s = T1Supplier(template_id=t.id, **body.model_dump())
    db.add(s)
    db.commit()
    after_save(db, t, project)
    db.refresh(s)
    return s


@router.delete("/{sprint}/suppliers/{supplier_id}", status_code=204)
def delete_supplier(project_id: int, sprint: int, supplier_id: int, db: Session = Depends(get_db)):
    project = get_project_or_404(project_id, db)
    t = _t(project_id, sprint, db)
    s = db.get(T1Supplier, supplier_id)
    if not s or s.template_id != t.id:
        raise HTTPException(404, "Fornecedor não encontrado")
    db.delete(s)
    db.commit()
    after_save(db, t, project)
