from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Template, T4Data, T4SecurityTest, T4PenTest, T4ResilienceTest, T4SupplierFailureSim, T4CrossSectorExercise
from schemas import (
    TemplateRead, TemplateApprove,
    T4DataCreate, T4DataRead,
    T4SecurityTestCreate, T4SecurityTestRead,
    T4PenTestCreate, T4PenTestRead,
    T4ResilienceTestCreate, T4ResilienceTestRead,
    T4SupplierFailureSimCreate, T4SupplierFailureSimRead,
    T4CrossSectorExerciseCreate, T4CrossSectorExerciseRead,
)
from routers._helpers import get_project_or_404, get_template_or_404, after_save

router = APIRouter(prefix="/projects/{project_id}/t4", tags=["T4"])


def _t(project_id: int, sprint: int, db: Session) -> Template:
    return get_template_or_404(project_id, "T4", sprint, db)


# ------------------------------------------------------------------
# Template
# ------------------------------------------------------------------

@router.post("/", response_model=TemplateRead, status_code=201)
def create_t4(project_id: int, sprint_number: int, db: Session = Depends(get_db)):
    get_project_or_404(project_id, db)
    if db.query(Template).filter_by(project_id=project_id, type="T4", sprint_number=sprint_number).first():
        raise HTTPException(409, f"T4 para sprint {sprint_number} já existe")
    t = Template(project_id=project_id, type="T4", sprint_number=sprint_number, status="IN_PROGRESS")
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


@router.get("/", response_model=List[TemplateRead])
def list_t4(project_id: int, db: Session = Depends(get_db)):
    return db.query(Template).filter_by(project_id=project_id, type="T4").order_by(Template.sprint_number).all()


@router.get("/{sprint}", response_model=TemplateRead)
def get_t4(project_id: int, sprint: int, db: Session = Depends(get_db)):
    return _t(project_id, sprint, db)


@router.post("/{sprint}/approve", response_model=TemplateRead)
def approve_t4(project_id: int, sprint: int, body: TemplateApprove, db: Session = Depends(get_db)):
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

@router.put("/{sprint}/data", response_model=T4DataRead)
def upsert_data(project_id: int, sprint: int, body: T4DataCreate, db: Session = Depends(get_db)):
    project = get_project_or_404(project_id, db)
    t = _t(project_id, sprint, db)
    d = t.t4_data
    if d:
        for k, v in body.model_dump().items():
            setattr(d, k, v)
    else:
        d = T4Data(template_id=t.id, **body.model_dump())
        db.add(d)
    t.filled_at = datetime.utcnow().isoformat()
    db.commit()
    after_save(db, t, project)
    db.refresh(d)
    return d


@router.get("/{sprint}/data", response_model=T4DataRead)
def get_data(project_id: int, sprint: int, db: Session = Depends(get_db)):
    t = _t(project_id, sprint, db)
    if not t.t4_data:
        raise HTTPException(404, "Dados T4 ainda não preenchidos")
    return t.t4_data


# ------------------------------------------------------------------
# Testes de segurança funcionais
# ------------------------------------------------------------------

@router.get("/{sprint}/security-tests", response_model=List[T4SecurityTestRead])
def list_sec_tests(project_id: int, sprint: int, db: Session = Depends(get_db)):
    return _t(project_id, sprint, db).t4_security_tests


@router.post("/{sprint}/security-tests", response_model=T4SecurityTestRead, status_code=201)
def add_sec_test(project_id: int, sprint: int, body: T4SecurityTestCreate, db: Session = Depends(get_db)):
    project = get_project_or_404(project_id, db)
    t = _t(project_id, sprint, db)
    st = T4SecurityTest(template_id=t.id, **body.model_dump())
    db.add(st)
    db.commit()
    after_save(db, t, project)
    db.refresh(st)
    return st


@router.delete("/{sprint}/security-tests/{test_id}", status_code=204)
def delete_sec_test(project_id: int, sprint: int, test_id: int, db: Session = Depends(get_db)):
    project = get_project_or_404(project_id, db)
    t = _t(project_id, sprint, db)
    st = db.get(T4SecurityTest, test_id)
    if not st or st.template_id != t.id:
        raise HTTPException(404, "Teste não encontrado")
    db.delete(st)
    db.commit()
    after_save(db, t, project)


# ------------------------------------------------------------------
# Pen Testing
# ------------------------------------------------------------------

@router.get("/{sprint}/pen-tests", response_model=List[T4PenTestRead])
def list_pen_tests(project_id: int, sprint: int, db: Session = Depends(get_db)):
    return _t(project_id, sprint, db).t4_pen_tests


@router.post("/{sprint}/pen-tests", response_model=T4PenTestRead, status_code=201)
def add_pen_test(project_id: int, sprint: int, body: T4PenTestCreate, db: Session = Depends(get_db)):
    project = get_project_or_404(project_id, db)
    t = _t(project_id, sprint, db)
    pt = T4PenTest(template_id=t.id, **body.model_dump())
    db.add(pt)
    db.commit()
    after_save(db, t, project)
    db.refresh(pt)
    return pt


@router.delete("/{sprint}/pen-tests/{pt_id}", status_code=204)
def delete_pen_test(project_id: int, sprint: int, pt_id: int, db: Session = Depends(get_db)):
    project = get_project_or_404(project_id, db)
    t = _t(project_id, sprint, db)
    pt = db.get(T4PenTest, pt_id)
    if not pt or pt.template_id != t.id:
        raise HTTPException(404, "Pen test não encontrado")
    db.delete(pt)
    db.commit()
    after_save(db, t, project)


# ------------------------------------------------------------------
# Testes de resiliência
# ------------------------------------------------------------------

@router.get("/{sprint}/resilience-tests", response_model=List[T4ResilienceTestRead])
def list_res_tests(project_id: int, sprint: int, db: Session = Depends(get_db)):
    return _t(project_id, sprint, db).t4_resilience_tests


@router.post("/{sprint}/resilience-tests", response_model=T4ResilienceTestRead, status_code=201)
def add_res_test(project_id: int, sprint: int, body: T4ResilienceTestCreate, db: Session = Depends(get_db)):
    project = get_project_or_404(project_id, db)
    t = _t(project_id, sprint, db)
    rt = T4ResilienceTest(template_id=t.id, **body.model_dump())
    db.add(rt)
    db.commit()
    after_save(db, t, project)
    db.refresh(rt)
    return rt


@router.delete("/{sprint}/resilience-tests/{rt_id}", status_code=204)
def delete_res_test(project_id: int, sprint: int, rt_id: int, db: Session = Depends(get_db)):
    project = get_project_or_404(project_id, db)
    t = _t(project_id, sprint, db)
    rt = db.get(T4ResilienceTest, rt_id)
    if not rt or rt.template_id != t.id:
        raise HTTPException(404, "Teste de resiliência não encontrado")
    db.delete(rt)
    db.commit()
    after_save(db, t, project)


# ------------------------------------------------------------------
# Simulação de falha de fornecedor
# ------------------------------------------------------------------

@router.get("/{sprint}/supplier-sims", response_model=List[T4SupplierFailureSimRead])
def list_sims(project_id: int, sprint: int, db: Session = Depends(get_db)):
    return _t(project_id, sprint, db).t4_supplier_failure_sims


@router.post("/{sprint}/supplier-sims", response_model=T4SupplierFailureSimRead, status_code=201)
def add_sim(project_id: int, sprint: int, body: T4SupplierFailureSimCreate, db: Session = Depends(get_db)):
    project = get_project_or_404(project_id, db)
    t = _t(project_id, sprint, db)
    sim = T4SupplierFailureSim(template_id=t.id, **body.model_dump())
    db.add(sim)
    db.commit()
    after_save(db, t, project)
    db.refresh(sim)
    return sim


@router.delete("/{sprint}/supplier-sims/{sim_id}", status_code=204)
def delete_sim(project_id: int, sprint: int, sim_id: int, db: Session = Depends(get_db)):
    project = get_project_or_404(project_id, db)
    t = _t(project_id, sprint, db)
    sim = db.get(T4SupplierFailureSim, sim_id)
    if not sim or sim.template_id != t.id:
        raise HTTPException(404, "Simulação não encontrada")
    db.delete(sim)
    db.commit()
    after_save(db, t, project)


# ------------------------------------------------------------------
# Exercícios Cross-Sector (Art. 49)
# ------------------------------------------------------------------

@router.get("/{sprint}/cross-sector", response_model=List[T4CrossSectorExerciseRead])
def list_exercises(project_id: int, sprint: int, db: Session = Depends(get_db)):
    return _t(project_id, sprint, db).t4_cross_sector_exercises


@router.post("/{sprint}/cross-sector", response_model=T4CrossSectorExerciseRead, status_code=201)
def add_exercise(project_id: int, sprint: int, body: T4CrossSectorExerciseCreate, db: Session = Depends(get_db)):
    project = get_project_or_404(project_id, db)
    t = _t(project_id, sprint, db)
    ex = T4CrossSectorExercise(template_id=t.id, **body.model_dump())
    db.add(ex)
    db.commit()
    after_save(db, t, project)
    db.refresh(ex)
    return ex


@router.delete("/{sprint}/cross-sector/{ex_id}", status_code=204)
def delete_exercise(project_id: int, sprint: int, ex_id: int, db: Session = Depends(get_db)):
    project = get_project_or_404(project_id, db)
    t = _t(project_id, sprint, db)
    ex = db.get(T4CrossSectorExercise, ex_id)
    if not ex or ex.template_id != t.id:
        raise HTTPException(404, "Exercício não encontrado")
    db.delete(ex)
    db.commit()
    after_save(db, t, project)
