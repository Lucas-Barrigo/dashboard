from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# =============================================================
# PROJECTS
# =============================================================

class ProjectCreate(BaseModel):
    name:         str
    institution:  str
    responsible: str


class ProjectUpdate(BaseModel):
    name:         Optional[str] = None
    institution:  Optional[str] = None
    responsible:  Optional[str] = None


class ProjectOut(ORMModel):
    id:                        int
    name:                      str
    institution:               str
    responsible:               str
    p1_active:                 bool
    p2_active:                 bool
    p3_active:                 bool
    p4_active:                 bool
    p5_active:                 bool
    qualification_signed_by:   Optional[str]
    qualification_signed_at:   Optional[datetime]
    created_at:                datetime


# =============================================================
# PILLAR QUALIFICATION (Y0)
# =============================================================

class PillarQuestionOut(ORMModel):
    question_key:  str
    pillar:        str
    question_text: str
    sort_order:    int


class PillarAnswerSubmit(BaseModel):
    question_key: str
    answer:       bool


class PillarAnswersSubmitRequest(BaseModel):
    answers: List[PillarAnswerSubmit]


class PillarAnswerOut(ORMModel):
    id:           int
    project_id:   int
    question_key: str
    answer:       bool
    answered_at:  datetime


# =============================================================
# CHECKLIST
# =============================================================

class ChecklistQuestionOut(ORMModel):
    id:                   int
    fase:                 str
    pillar:               str
    dora_article:         str
    topic_title:          str
    control_description:  str
    question_text:        str
    sort_order:           int


class ChecklistQuestionWithAnswerOut(ChecklistQuestionOut):
    pillar_active:   bool  # whether the pillar is active for this project
    answer:          Optional[str]  # 'sim', 'nao', 'nao_aplicavel', or null


class ChecklistAnswerSubmit(BaseModel):
    question_id: int
    answer:      Optional[str]  # 'sim', 'nao', 'nao_aplicavel'
    comment:     Optional[str] = None
    answered_by: Optional[str] = None


class ChecklistAnswerOut(ORMModel):
    id:          int
    project_id:  int
    question_id: int
    answer:      Optional[str]
    comment:     Optional[str]
    answered_by: Optional[str]
    answered_at: datetime


class ChecklistSummaryByPillar(BaseModel):
    pillar:     str
    total:      int
    answered:   int
    sim:        int
    nao:        int
    nao_aplicavel: int


class ChecklistSummaryByFase(BaseModel):
    fase:       str
    total:      int
    answered:   int
    sim:        int
    nao:        int
    nao_aplicavel: int


class ChecklistSummary(BaseModel):
    total:           int
    answered:        int
    sim:             int
    nao:             int
    nao_aplicavel:   int
    by_pillar:       List[ChecklistSummaryByPillar]
    by_fase:         List[ChecklistSummaryByFase]


# Signatures per fase
class ChecklistSignatureOut(ORMModel):
    id: int
    project_id: int
    fase: str
    signed_by: Optional[str]
    signed_at: Optional[datetime]


class ChecklistSignRequest(BaseModel):
    fase: str
    signed_by: str
