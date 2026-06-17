from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base, SessionLocal
from routers import projects, qualification, checklist
from models import PillarQuestion, ChecklistQuestion
from seed_questions import CHECKLIST_QUESTIONS

Base.metadata.create_all(bind=engine)

_PILLAR_QUALIFICATION_QUESTIONS = [
    ("P1_Q1", "P1", "O sistema suporta funções críticas ou importantes da instituição?", 1),
    ("P1_Q2", "P1", "O sistema processa dados financeiros ou de clientes?", 2),
    ("P1_Q3", "P1", "O projeto envolve alterações à infraestrutura de produção?", 3),
    ("P1_Q4", "P1", "O projeto introduz novas tecnologias ou arquiteturas?", 4),
    ("P2_Q1", "P2", "O sistema estará em produção e sujeito a monitorização contínua?", 5),
    ("P2_Q2", "P2", "Uma falha do sistema pode causar interrupção de serviços financeiros?", 6),
    ("P2_Q3", "P2", "O sistema processa transações em tempo real?", 7),
    ("P3_Q1", "P3", "O projeto afeta sistemas classificados como críticos pela instituição?", 8),
    ("P3_Q2", "P3", "A instituição está sujeita a TLPT obrigatório (Art. 26) para este tipo de sistema?", 9),
    ("P3_Q3", "P3", "O projeto introduz alterações significativas a sistemas existentes?", 10),
    ("P4_Q1", "P4", "O projeto envolve fornecedores TIC externos?", 11),
    ("P4_Q2", "P4", "Algum fornecedor terá acesso a sistemas ou dados críticos?", 12),
    ("P4_Q3", "P4", "O projeto depende de serviços cloud ou infraestrutura de terceiros?", 13),
    ("P5_Q1", "P5", "A instituição participa em acordos de partilha de informação?", 14),
    ("P5_Q2", "P5", "O projeto envolve sistemas onde IOCs devem ser reportados ao setor?", 15),
]


def _seed():
    db = SessionLocal()
    try:
        # Seed pillar qualification questions
        for qk, p, qt, so in _PILLAR_QUALIFICATION_QUESTIONS:
            if not db.query(PillarQuestion).filter_by(question_key=qk).first():
                db.add(PillarQuestion(question_key=qk, pillar=p, question_text=qt, sort_order=so))

        # Seed checklist questions (94 from Excel)
        for i, q_dict in enumerate(CHECKLIST_QUESTIONS, 1):
            if not db.query(ChecklistQuestion).filter_by(
                dora_article=q_dict["dora_article"],
                fase=q_dict["fase"],
                pillar=q_dict["pillar"]
            ).first():
                db.add(ChecklistQuestion(
                    fase=q_dict["fase"],
                    pillar=q_dict["pillar"],
                    dora_article=q_dict["dora_article"],
                    topic_title=q_dict["topic_title"],
                    control_description=q_dict["control_description"],
                    question_text=q_dict["question_text"],
                    sort_order=i,
                ))

        db.commit()
    finally:
        db.close()


_seed()

app = FastAPI(
    title="DORA Compliance Checklist",
    version="2.0.0",
    description="Pure checklist application for DORA (EU 2022/2554) compliance",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router)
app.include_router(qualification.router)
app.include_router(checklist.router)


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok"}
