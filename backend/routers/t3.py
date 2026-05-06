from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Template, T3Data, T3PipelineScan, T3Dependency
from schemas import (
    TemplateRead, TemplateApprove,
    T3DataCreate, T3DataRead,
    T3PipelineScanCreate, T3PipelineScanRead,
    T3DependencyCreate, T3DependencyRead,
)
from routers._helpers import get_project_or_404, get_template_or_404, after_save

router = APIRouter(prefix="/projects/{project_id}/t3", tags=["T3"])


def _t(project_id: int, sprint: int, db: Session) -> Template:
    return get_template_or_404(project_id, "T3", sprint, db)


# ------------------------------------------------------------------
# Template
# ------------------------------------------------------------------

@router.post("/", response_model=TemplateRead, status_code=201)
def create_t3(project_id: int, sprint_number: int, db: Session = Depends(get_db)):
    get_project_or_404(project_id, db)
    if db.query(Template).filter_by(project_id=project_id, type="T3", sprint_number=sprint_number).first():
        raise HTTPException(409, f"T3 para sprint {sprint_number} já existe")
    t = Template(project_id=project_id, type="T3", sprint_number=sprint_number, status="IN_PROGRESS")
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


@router.get("/", response_model=List[TemplateRead])
def list_t3(project_id: int, db: Session = Depends(get_db)):
    return db.query(Template).filter_by(project_id=project_id, type="T3").order_by(Template.sprint_number).all()


@router.get("/{sprint}", response_model=TemplateRead)
def get_t3(project_id: int, sprint: int, db: Session = Depends(get_db)):
    return _t(project_id, sprint, db)


@router.post("/{sprint}/approve", response_model=TemplateRead)
def approve_t3(project_id: int, sprint: int, body: TemplateApprove, db: Session = Depends(get_db)):
    project = get_project_or_404(project_id, db)
    t = _t(project_id, sprint, db)
    # Bloquear se há scans com CVSS >= 7.0 por resolver
    critical = [s for s in t.t3_pipeline_scans if s.critical_vulns > 0]
    if critical:
        raise HTTPException(400,
            f"T3 não pode ser fechado: {sum(s.critical_vulns for s in critical)} "
            "vulnerabilidade(s) CVSS ≥ 7.0 por resolver no pipeline.")
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

@router.put("/{sprint}/data", response_model=T3DataRead)
def upsert_data(project_id: int, sprint: int, body: T3DataCreate, db: Session = Depends(get_db)):
    project = get_project_or_404(project_id, db)
    t = _t(project_id, sprint, db)
    d = t.t3_data
    if d:
        for k, v in body.model_dump().items():
            setattr(d, k, v)
    else:
        d = T3Data(template_id=t.id, **body.model_dump())
        db.add(d)
    t.filled_at = datetime.utcnow().isoformat()
    db.commit()
    after_save(db, t, project)
    db.refresh(d)
    return d


@router.get("/{sprint}/data", response_model=T3DataRead)
def get_data(project_id: int, sprint: int, db: Session = Depends(get_db)):
    t = _t(project_id, sprint, db)
    if not t.t3_data:
        raise HTTPException(404, "Dados T3 ainda não preenchidos")
    return t.t3_data


# ------------------------------------------------------------------
# Pipeline Scans (SAST / SCA / IAC / DAST)
# ------------------------------------------------------------------

@router.get("/{sprint}/scans", response_model=List[T3PipelineScanRead])
def list_scans(project_id: int, sprint: int, db: Session = Depends(get_db)):
    return _t(project_id, sprint, db).t3_pipeline_scans


@router.post("/{sprint}/scans", response_model=T3PipelineScanRead, status_code=201)
def add_scan(project_id: int, sprint: int, body: T3PipelineScanCreate, db: Session = Depends(get_db)):
    project = get_project_or_404(project_id, db)
    t = _t(project_id, sprint, db)
    scan = T3PipelineScan(template_id=t.id, **body.model_dump())
    db.add(scan)
    db.commit()
    after_save(db, t, project)
    db.refresh(scan)
    return scan


@router.delete("/{sprint}/scans/{scan_id}", status_code=204)
def delete_scan(project_id: int, sprint: int, scan_id: int, db: Session = Depends(get_db)):
    project = get_project_or_404(project_id, db)
    t = _t(project_id, sprint, db)
    scan = db.get(T3PipelineScan, scan_id)
    if not scan or scan.template_id != t.id:
        raise HTTPException(404, "Scan não encontrado")
    db.delete(scan)
    db.commit()
    after_save(db, t, project)


# ------------------------------------------------------------------
# Dependências
# ------------------------------------------------------------------

@router.get("/{sprint}/dependencies", response_model=List[T3DependencyRead])
def list_deps(project_id: int, sprint: int, db: Session = Depends(get_db)):
    return _t(project_id, sprint, db).t3_dependencies


@router.post("/{sprint}/dependencies", response_model=T3DependencyRead, status_code=201)
def add_dep(project_id: int, sprint: int, body: T3DependencyCreate, db: Session = Depends(get_db)):
    project = get_project_or_404(project_id, db)
    t = _t(project_id, sprint, db)
    dep = T3Dependency(template_id=t.id, **body.model_dump())
    db.add(dep)
    db.commit()
    after_save(db, t, project)
    db.refresh(dep)
    return dep


@router.delete("/{sprint}/dependencies/{dep_id}", status_code=204)
def delete_dep(project_id: int, sprint: int, dep_id: int, db: Session = Depends(get_db)):
    project = get_project_or_404(project_id, db)
    t = _t(project_id, sprint, db)
    dep = db.get(T3Dependency, dep_id)
    if not dep or dep.template_id != t.id:
        raise HTTPException(404, "Dependência não encontrada")
    db.delete(dep)
    db.commit()
    after_save(db, t, project)
