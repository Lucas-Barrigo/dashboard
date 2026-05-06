from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Template, T2Data, T2Threat, T2ADR, T2SupplierSLA
from schemas import (
    TemplateRead, TemplateApprove,
    T2DataCreate, T2DataRead,
    T2ThreatCreate, T2ThreatRead,
    T2ADRCreate, T2ADRApprove, T2ADRRead,
    T2SupplierSLACreate, T2SupplierSLARead,
)
from routers._helpers import get_project_or_404, get_template_or_404, after_save

router = APIRouter(prefix="/projects/{project_id}/t2", tags=["T2"])


def _t(project_id: int, sprint: int, db: Session) -> Template:
    return get_template_or_404(project_id, "T2", sprint, db)


# ------------------------------------------------------------------
# Template
# ------------------------------------------------------------------

@router.post("/", response_model=TemplateRead, status_code=201)
def create_t2(project_id: int, sprint_number: int, db: Session = Depends(get_db)):
    get_project_or_404(project_id, db)
    if db.query(Template).filter_by(project_id=project_id, type="T2", sprint_number=sprint_number).first():
        raise HTTPException(409, f"T2 para sprint {sprint_number} já existe")
    t = Template(project_id=project_id, type="T2", sprint_number=sprint_number, status="IN_PROGRESS")
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


@router.get("/", response_model=List[TemplateRead])
def list_t2(project_id: int, db: Session = Depends(get_db)):
    return db.query(Template).filter_by(project_id=project_id, type="T2").order_by(Template.sprint_number).all()


@router.get("/{sprint}", response_model=TemplateRead)
def get_t2(project_id: int, sprint: int, db: Session = Depends(get_db)):
    return _t(project_id, sprint, db)


@router.post("/{sprint}/approve", response_model=TemplateRead)
def approve_t2(project_id: int, sprint: int, body: TemplateApprove, db: Session = Depends(get_db)):
    project = get_project_or_404(project_id, db)
    t = _t(project_id, sprint, db)
    # Bloquear se há ADRs sem aprovação do Risk Manager
    unapproved = [a for a in t.t2_adrs if not a.risk_mgr_approved]
    if unapproved:
        raise HTTPException(400,
            f"T2 não pode ser fechado: {len(unapproved)} ADR(s) sem aprovação do Risk Manager.")
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

@router.put("/{sprint}/data", response_model=T2DataRead)
def upsert_data(project_id: int, sprint: int, body: T2DataCreate, db: Session = Depends(get_db)):
    project = get_project_or_404(project_id, db)
    t = _t(project_id, sprint, db)
    d = t.t2_data
    if d:
        for k, v in body.model_dump().items():
            setattr(d, k, v)
    else:
        d = T2Data(template_id=t.id, **body.model_dump())
        db.add(d)
    t.filled_at = datetime.utcnow().isoformat()
    db.commit()
    after_save(db, t, project)
    db.refresh(d)
    return d


@router.get("/{sprint}/data", response_model=T2DataRead)
def get_data(project_id: int, sprint: int, db: Session = Depends(get_db)):
    t = _t(project_id, sprint, db)
    if not t.t2_data:
        raise HTTPException(404, "Dados T2 ainda não preenchidos")
    return t.t2_data


# ------------------------------------------------------------------
# Threat Model (STRIDE)
# ------------------------------------------------------------------

@router.get("/{sprint}/threats", response_model=List[T2ThreatRead])
def list_threats(project_id: int, sprint: int, db: Session = Depends(get_db)):
    return _t(project_id, sprint, db).t2_threats


@router.post("/{sprint}/threats", response_model=T2ThreatRead, status_code=201)
def add_threat(project_id: int, sprint: int, body: T2ThreatCreate, db: Session = Depends(get_db)):
    project = get_project_or_404(project_id, db)
    t = _t(project_id, sprint, db)
    th = T2Threat(template_id=t.id, **body.model_dump())
    db.add(th)
    db.commit()
    after_save(db, t, project)
    db.refresh(th)
    return th


@router.delete("/{sprint}/threats/{threat_id}", status_code=204)
def delete_threat(project_id: int, sprint: int, threat_id: int, db: Session = Depends(get_db)):
    project = get_project_or_404(project_id, db)
    t = _t(project_id, sprint, db)
    th = db.get(T2Threat, threat_id)
    if not th or th.template_id != t.id:
        raise HTTPException(404, "Ameaça não encontrada")
    db.delete(th)
    db.commit()
    after_save(db, t, project)


# ------------------------------------------------------------------
# ADRs
# ------------------------------------------------------------------

@router.get("/{sprint}/adrs", response_model=List[T2ADRRead])
def list_adrs(project_id: int, sprint: int, db: Session = Depends(get_db)):
    return _t(project_id, sprint, db).t2_adrs


@router.post("/{sprint}/adrs", response_model=T2ADRRead, status_code=201)
def add_adr(project_id: int, sprint: int, body: T2ADRCreate, db: Session = Depends(get_db)):
    project = get_project_or_404(project_id, db)
    t = _t(project_id, sprint, db)
    adr = T2ADR(template_id=t.id, **body.model_dump())
    db.add(adr)
    db.commit()
    after_save(db, t, project)
    db.refresh(adr)
    return adr


@router.post("/{sprint}/adrs/{adr_id}/approve", response_model=T2ADRRead)
def approve_adr(project_id: int, sprint: int, adr_id: int,
                body: T2ADRApprove, db: Session = Depends(get_db)):
    project = get_project_or_404(project_id, db)
    t = _t(project_id, sprint, db)
    adr = db.get(T2ADR, adr_id)
    if not adr or adr.template_id != t.id:
        raise HTTPException(404, "ADR não encontrado")
    adr.risk_mgr_approved = True
    adr.approved_at = body.approved_at
    db.commit()
    after_save(db, t, project)
    db.refresh(adr)
    return adr


@router.delete("/{sprint}/adrs/{adr_id}", status_code=204)
def delete_adr(project_id: int, sprint: int, adr_id: int, db: Session = Depends(get_db)):
    project = get_project_or_404(project_id, db)
    t = _t(project_id, sprint, db)
    adr = db.get(T2ADR, adr_id)
    if not adr or adr.template_id != t.id:
        raise HTTPException(404, "ADR não encontrado")
    db.delete(adr)
    db.commit()
    after_save(db, t, project)


# ------------------------------------------------------------------
# SLAs de fornecedores
# ------------------------------------------------------------------

@router.get("/{sprint}/slas", response_model=List[T2SupplierSLARead])
def list_slas(project_id: int, sprint: int, db: Session = Depends(get_db)):
    return _t(project_id, sprint, db).t2_supplier_slas


@router.post("/{sprint}/slas", response_model=T2SupplierSLARead, status_code=201)
def add_sla(project_id: int, sprint: int, body: T2SupplierSLACreate, db: Session = Depends(get_db)):
    project = get_project_or_404(project_id, db)
    t = _t(project_id, sprint, db)
    sla = T2SupplierSLA(template_id=t.id, **body.model_dump())
    db.add(sla)
    db.commit()
    after_save(db, t, project)
    db.refresh(sla)
    return sla


@router.delete("/{sprint}/slas/{sla_id}", status_code=204)
def delete_sla(project_id: int, sprint: int, sla_id: int, db: Session = Depends(get_db)):
    project = get_project_or_404(project_id, db)
    t = _t(project_id, sprint, db)
    sla = db.get(T2SupplierSLA, sla_id)
    if not sla or sla.template_id != t.id:
        raise HTTPException(404, "SLA não encontrado")
    db.delete(sla)
    db.commit()
    after_save(db, t, project)
