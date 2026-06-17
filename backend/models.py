from datetime import datetime
from typing import Optional, List

from sqlalchemy import (
    Boolean, DateTime, ForeignKey,
    Integer, String, Text, UniqueConstraint, CheckConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Project(Base):
    __tablename__ = "projects"

    id:                           Mapped[int]    = mapped_column(primary_key=True)
    name:                         Mapped[str]    = mapped_column(String, nullable=False)
    institution:                  Mapped[str]    = mapped_column(String, nullable=False)
    responsible:                  Mapped[str]    = mapped_column(String, nullable=False)
    p1_active:                    Mapped[bool]   = mapped_column(Boolean, default=False)
    p2_active:                    Mapped[bool]   = mapped_column(Boolean, default=False)
    p3_active:                    Mapped[bool]   = mapped_column(Boolean, default=False)
    p4_active:                    Mapped[bool]   = mapped_column(Boolean, default=False)
    p5_active:                    Mapped[bool]   = mapped_column(Boolean, default=False)
    qualification_signed_by:      Mapped[Optional[str]] = mapped_column(String, nullable=True)
    qualification_signed_at:      Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at:                   Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    pillar_answers:    Mapped[List["PillarAnswer"]]    = relationship(cascade="all, delete-orphan")
    checklist_answers: Mapped[List["ChecklistAnswer"]] = relationship(cascade="all, delete-orphan")
    checklist_signatures: Mapped[List["ChecklistSignature"]] = relationship(cascade="all, delete-orphan")

    def get_active_pillars(self):
        return [f"P{i}" for i in range(1, 6) if getattr(self, f"p{i}_active")]

    def is_qualification_signed(self):
        return self.qualification_signed_by is not None


class PillarQuestion(Base):
    __tablename__ = "pillar_questions"

    question_key:  Mapped[str] = mapped_column(String(10), primary_key=True)
    pillar:        Mapped[str] = mapped_column(String(2), nullable=False)
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    sort_order:    Mapped[int] = mapped_column(Integer, nullable=False)


class PillarAnswer(Base):
    __tablename__ = "pillar_answers"
    __table_args__ = (
        UniqueConstraint("project_id", "question_key", name="uq_pillar_answer"),
    )

    id:            Mapped[int] = mapped_column(primary_key=True)
    project_id:    Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    question_key:  Mapped[str] = mapped_column(String(10), ForeignKey("pillar_questions.question_key"), nullable=False)
    answer:        Mapped[bool] = mapped_column(Boolean, nullable=False)
    answered_at:   Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class ChecklistQuestion(Base):
    __tablename__ = "checklist_questions"

    id:                   Mapped[int] = mapped_column(primary_key=True)
    fase:                 Mapped[str] = mapped_column(String(50), nullable=False)
    pillar:               Mapped[str] = mapped_column(String(2), nullable=False)
    dora_article:         Mapped[str] = mapped_column(String(20), nullable=False)
    topic_title:          Mapped[str] = mapped_column(String(255), nullable=False)
    control_description:  Mapped[str] = mapped_column(Text, nullable=False)
    question_text:        Mapped[str] = mapped_column(Text, nullable=False)
    sort_order:           Mapped[int] = mapped_column(Integer, nullable=False)


class ChecklistAnswer(Base):
    __tablename__ = "checklist_answers"
    __table_args__ = (
        UniqueConstraint("project_id", "question_id", name="uq_checklist_answer"),
        CheckConstraint("answer IN ('sim', 'nao', 'nao_aplicavel')", name="ck_answer_enum"),
    )

    id:          Mapped[int] = mapped_column(primary_key=True)
    project_id:  Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    question_id: Mapped[int] = mapped_column(ForeignKey("checklist_questions.id"), nullable=False)
    answer:      Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    comment:     Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    answered_by: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    answered_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class ChecklistSignature(Base):
    __tablename__ = "checklist_signatures"

    id:         Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    fase:       Mapped[str] = mapped_column(String(50), nullable=False)
    signed_by:  Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    signed_at:  Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

