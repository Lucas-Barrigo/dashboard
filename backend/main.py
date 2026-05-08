from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base, SessionLocal
from routers import projects, t0, t1, t2, t3, t4, t5, dashboard, section_na
from models import PillarQuestion

Base.metadata.create_all(bind=engine)

def _migrate():
    from sqlalchemy import text
    _cols = [
        ("t3_data", "systems_capacity_assessed",  "BOOLEAN NOT NULL DEFAULT 0"),
        ("t3_data", "patches_applied_or_planned",  "BOOLEAN NOT NULL DEFAULT 0"),
        ("t4_data", "tlpt_tester_certified",       "BOOLEAN NOT NULL DEFAULT 0"),
        ("t4_data", "tlpt_tester_insured",         "BOOLEAN NOT NULL DEFAULT 0"),
        ("t5_data", "systems_patches_current",     "BOOLEAN NOT NULL DEFAULT 0"),
        ("t5_data", "backup_restore_tested",       "BOOLEAN NOT NULL DEFAULT 0"),
        ("t5_data", "backup_storage_segregated",   "BOOLEAN NOT NULL DEFAULT 0"),
        ("t5_data", "crisis_comms_plan_tested",    "BOOLEAN NOT NULL DEFAULT 0"),
        ("t1_risks", "acceptance_justification",   "TEXT"),
    ]
    with engine.connect() as conn:
        for table, col, typedef in _cols:
            try:
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {typedef}"))
            except Exception:
                pass
        conn.commit()

_migrate()

_SEED_QUESTIONS = [
    ("P1_Q1","P1","O sistema suporta funções críticas ou importantes da instituição?",1),
    ("P1_Q2","P1","O sistema processa dados financeiros ou de clientes?",2),
    ("P1_Q3","P1","O projeto envolve alterações à infraestrutura de produção?",3),
    ("P1_Q4","P1","O projeto introduz novas tecnologias ou arquiteturas?",4),
    ("P2_Q1","P2","O sistema estará em produção e sujeito a monitorização contínua?",5),
    ("P2_Q2","P2","Uma falha do sistema pode causar interrupção de serviços financeiros?",6),
    ("P2_Q3","P2","O sistema processa transações em tempo real?",7),
    ("P3_Q1","P3","O projeto afeta sistemas classificados como críticos pela instituição?",8),
    ("P3_Q2","P3","A instituição está sujeita a TLPT obrigatório (Art. 26) para este tipo de sistema?",9),
    ("P3_Q3","P3","O projeto introduz alterações significativas a sistemas existentes?",10),
    ("P4_Q1","P4","O projeto envolve fornecedores TIC externos?",11),
    ("P4_Q2","P4","Algum fornecedor terá acesso a sistemas ou dados críticos?",12),
    ("P4_Q3","P4","O projeto depende de serviços cloud ou infraestrutura de terceiros?",13),
    ("P5_Q1","P5","A instituição participa em acordos de partilha de informação?",14),
    ("P5_Q2","P5","O projeto envolve sistemas onde IOCs devem ser reportados ao setor?",15),
]

def _seed():
    db = SessionLocal()
    try:
        for qk, p, qt, so in _SEED_QUESTIONS:
            if not db.query(PillarQuestion).filter_by(question_key=qk).first():
                db.add(PillarQuestion(question_key=qk, pillar=p, question_text=qt, sort_order=so))
        db.commit()
    finally:
        db.close()

_seed()

app = FastAPI(
    title="DORA Compliance Dashboard",
    version="1.0.0",
    description="API for managing DORA (EU 2022/2554) compliance across Agile/DevSecOps sprints",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router)
app.include_router(t0.router)
app.include_router(t1.router)
app.include_router(t2.router)
app.include_router(t3.router)
app.include_router(t4.router)
app.include_router(t5.router)
app.include_router(dashboard.router)
app.include_router(section_na.router)


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok"}
