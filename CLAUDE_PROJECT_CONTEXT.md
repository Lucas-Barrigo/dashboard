# DORA Compliance Dashboard — Contexto de Desenvolvimento

> Ficheiro de contexto para o projeto Claude da dissertação.  
> Descreve a arquitetura, decisões de design e estado atual do código.

---

## 1. Objetivo do Projeto

Aplicação web para gestão da conformidade com o **DORA (Digital Operational Resilience Act — Regulamento UE 2022/2554)** ao longo do ciclo de desenvolvimento de software (SDLC). Desenvolvida como caso de estudo de dissertação, com validação retroativa sobre projetos reais do **Natixis/Banco Atlântico**.

O sistema permite que equipas de desenvolvimento registem evidências de conformidade por sprint, organizadas em 6 templates (T0–T5) alinhados com as fases do SDLC. O dashboard agrega os resultados e calcula scores de conformidade por fase e por pilar DORA.

---

## 2. Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + TypeScript + Vite + TailwindCSS |
| Backend | Python 3.12 + FastAPI + SQLAlchemy (ORM) |
| Base de dados | SQLite (ficheiro local `db/dora.db`) |
| Comunicação | REST API (JSON) |
| Sem autenticação | Fora do âmbito da dissertação |

Arranque: `start-backend.bat` (porta 8000) + `start-frontend.bat` (porta 5173).

---

## 3. Os 5 Pilares DORA

| Pilar | Nome | Artigos DORA |
|-------|------|-------------|
| P1 | ICT Risk Management | Art. 5–15 |
| P2 | Incident Management | Art. 17–23 |
| P3 | Digital Operational Resilience Testing | Art. 24–27 |
| P4 | Third-Party Risk Management | Art. 28–44 |
| P5 | Information Sharing | Art. 45–49 |

Cada pilar é **ativado individualmente por projeto** no T0. Pilares inativos têm as suas secções marcadas como N/A e excluídos do score de conformidade.

---

## 4. Templates SDLC (T0–T5)

### T0 — Qualificação (pré-SDLC)
- Questionário de ativação de pilares (perguntas binárias por pilar)
- Define criticidade do projeto (CRITICAL / HIGH / MEDIUM / LOW)
- Obrigatório antes de qualquer outro template
- Requer aprovação formal (CRO/Risk Officer)
- **Ficheiros:** `backend/routers/t0.py`, `frontend/src/pages/templates/T0Page.tsx`

### T1 — Planeamento & Risco ICT (por sprint)
- User Stories com flags: `affects_critical_system`, `introduces_ict_risk`, `production_change`, `new_third_party`
- Critérios CIA por user story (confidencialidade, integridade, disponibilidade)
- **Registo de Riscos** com: `risk_ref`, `probability`, `impact`, `pillar`, `mitigation`, `status`, `acceptance_justification`
  - Estados de risco: OPEN / MITIGATED / ACCEPTED / CLOSED
  - OPEN sem mitigação + impacto HIGH → alerta CRITICAL; MEDIUM/LOW → WARNING
  - OPEN com mitigação definida → sem alerta (em tratamento, visualmente azul)
  - ACCEPTED requer `acceptance_justification` obrigatória (justificação formal auditável)
- Plano de Resposta a Incidentes (estado: COMPLETE activa resolução de alerta)
- Registo de Fornecedores (contrato PENDING → alerta P4)
- **Ficheiros:** `backend/routers/t1.py`, `frontend/src/pages/templates/T1Page.tsx`

### T2 — Arquitetura & Ameaças (por sprint)
- Checklist Zero Trust (autenticação mútua, segmentação, least privilege)
- Checklist resiliência (circuit breakers, failover, DRP, redundância, backup)
- **Threat Model STRIDE** — colunas: Ref, Categoria, Descrição, Ativo Afetado, Risco, Mitigação
  - `test_ref` foi **removido** do T2 (a ligação é feita no sentido T4→T2, não T2→T4)
- **ADRs** — requerem aprovação do Risk Manager (critério de saída obrigatório para fechar sprint T2)
- **SLAs de Fornecedores** — sem SLAs ou todos BREACHED → alerta P2
- **Ficheiros:** `backend/routers/t2.py`, `frontend/src/pages/templates/T2Page.tsx`

### T3 — Implementação & Pipeline DevSecOps (por sprint)
- Checklist: OWASP, code review, gestão de segredos, logging, retenção 7 anos, proteção de audit trail
- **Art. 7 DORA** — campos: `systems_capacity_assessed`, `patches_applied_or_planned`
- **Pipeline Scans** — tipos: SAST / SCA / DAST / IAC / SECRET_SCAN / CONTAINER_SCAN
  - Scans com `critical_vulns > 0` → alerta CRITICAL
- **Dependências** — CVE/CVSS preenchidos apenas quando há vulnerabilidade; estado: OK / VULNERABLE / PATCHED / ACCEPTED
- **Ficheiros:** `backend/routers/t3.py`, `frontend/src/pages/templates/T3Page.tsx`

### T4 — Testes de Resiliência (por sprint)
- **TLPT** (Art. 26/27): `tlpt_applicable`, `tlpt_completed_or_scheduled`, `tlpt_date`
  - Se agendado: mostra campos Art. 27 — `tlpt_tester_certified`, `tlpt_tester_insured`
  - TLPT aplicável mas não agendado → alerta CRITICAL P3
- **Testes Funcionais de Segurança** — campo `threat_ref` é **dropdown** populado das ameaças STRIDE do T2 do mesmo sprint (ligação T4→T2)
- **Pen Tests** — `critical_vulns_found > critical_vulns_remediated` → alerta CRITICAL P3
- **Testes de Resiliência** — BCP/DR com RTO alvo vs. atingido
- **Simulações de Fornecedor** — cenários de falha com contingência
- **Exercícios Cross-Sector** (Art. 49) — `exercise_name`, `organized_by`, `participation_type` (PARTICIPANT/OBSERVER/ORGANIZER), `scenario_type`, `outcome`
- **Ficheiros:** `backend/routers/t4.py`, `frontend/src/pages/templates/T4Page.tsx`

### T5 — Operações & Incidentes (por sprint)
- Checklist deploy seguro: hardening, rotação de segredos, scan pós-deploy, plano de rollback
- SIEM/monitoring: regras de monitorização, threat intel feeds, avaliação contínua de vulnerabilidades
- **Art. 7** — `systems_patches_current`
- **Art. 12** — `backup_restore_tested`, `backup_storage_segregated`
- **Art. 14** — `crisis_comms_plan_tested`
- **Gestão de Incidentes** — `notification_within_4h` obrigatório (Art. 19); falha → alerta CRITICAL P2
- **Avaliação de Fornecedores** — alerta P4 (WARNING) se fornecedor do T1 não tiver avaliação no T5 (Art. 28)
- **Acordos de Partilha** (P5 — único template com secção P5): `ioc_sharing_active`, `threat_intel_incorporated`, `authority_reporting_active`
- **Ficheiros:** `backend/routers/t5.py`, `frontend/src/pages/templates/T5Page.tsx`

---

## 5. Arquitetura Backend

```
backend/
├── main.py                    # FastAPI app, CORS, routers, _migrate(), seed T0 questions
├── database.py                # SQLAlchemy engine + session
├── models.py                  # Todos os modelos ORM (SQLAlchemy mapped_column)
├── schemas.py                 # Pydantic schemas (Create/Read por entidade)
├── routers/
│   ├── projects.py            # CRUD de projetos
│   ├── t0.py – t5.py          # Endpoints por template
│   ├── dashboard.py           # Scores, evidências, alertas
│   └── section_na.py          # Marcar secções como N/A
└── services/
    ├── evidence_tracker.py    # Mapeia campos bool → COLLECTED/MISSING/NA
    ├── compliance_calculator.py # Score = COLLECTED / (total - NA) × 100
    ├── alert_engine.py        # Regras de alerta por template
    └── pillar_activation.py   # Lê T0 e activa p1_active..p5_active no Project
```

### Fluxo de gravação (qualquer template)
1. `PUT /projects/{pid}/tN/{sprint}/data` → router guarda dados
2. Router chama `evidence_tracker.refresh(db, template, project)`
3. `evidence_tracker` mapeia cada campo booleano → `Evidence(status=COLLECTED|MISSING|NA)`
4. Router chama `compliance_calculator.recalculate(db, project)`
5. Router chama `alert_engine.run(db, project, template)`

### Migrações
Sem Alembic. Novas colunas adicionadas em `main.py` via `_migrate()` que executa `ALTER TABLE … ADD COLUMN` com try/except (idempotente). Novas tabelas criadas por `Base.metadata.create_all`.

---

## 6. Arquitetura Frontend

```
frontend/src/
├── api.ts                     # Todos os tipos TypeScript + chamadas axios por template
├── App.tsx                    # Router (react-router-dom): /, /projects/:id, /projects/:id/tN
├── components/
│   ├── ui.tsx                 # Design system: Card, Badge, Button, Table, Modal, etc.
│   ├── SectionNA.tsx          # Wrapper que renderiza Card+Header com botão N/A integrado
│   ├── SprintSelector.tsx     # Selector/criador de sprints por template
│   └── Layout.tsx             # Sidebar, Breadcrumbs
└── pages/
    ├── ProjectsPage.tsx       # Lista de projetos
    ├── ProjectPage.tsx        # Dashboard de projeto (scores, alertas, pipeline visual)
    └── templates/
        └── T0Page.tsx – T5Page.tsx
```

### Componente SectionNA
Cada secção de tabela (ameaças, riscos, scans, etc.) é envolvida por `<SectionNA>`. Este componente:
- Renderiza o `Card` + `CardHeader` internamente (o conteúdo filho é apenas a tabela/Empty)
- Coloca o botão "N/A" na área de action do header
- Props: `pid`, `templateType`, `sprint`, `sectionKey`, `title`, `action`, `exclusion`, `onChanged`

---

## 7. Modelo de Dados Principal

### Tabelas de suporte por template

| Entidade | Template | Colunas chave |
|----------|----------|---------------|
| T1UserStory | T1 | story_ref, affects_critical_system, introduces_ict_risk, production_change, new_third_party, criteria_CIA |
| T1Risk | T1 | risk_ref, probability, impact, pillar, mitigation, status, acceptance_justification |
| T1Supplier | T1 | supplier_name, contract_status, critical_system_access |
| T2Threat | T2 | threat_ref, stride_category, description, affected_asset, risk_level, mitigation |
| T2ADR | T2 | adr_ref, decision, context, alternatives, security_justification, dora_implications, risk_mgr_approved |
| T2SupplierSLA | T2 | supplier_name, availability_sla, incident_notification_clause, audit_rights, sla_status |
| T3PipelineScan | T3 | scan_type, pipeline_stage, environment, tool_used, result, critical_vulns, report_ref |
| T3Dependency | T3 | package_name, version, cve_id, cvss_score, status |
| T4SecurityTest | T4 | test_ref, threat_ref (→T2Threat), description, result, evidence_ref |
| T4PenTest | T4 | test_date, responsible_entity, scope, critical_vulns_found, critical_vulns_remediated |
| T4ResilienceTest | T4 | test_type, test_date, rto_target, rto_achieved, result |
| T4SupplierFailureSim | T4 | supplier_name, scenario_description, contingency_activated, result |
| T4CrossSectorExercise | T4 | exercise_name, exercise_date, organized_by, participation_type, scenario_type, outcome |
| T5Incident | T5 | incident_ref, classification, detected_at, notified_at, notification_within_4h, post_mortem_completed |
| T5SupplierEvaluation | T5 | supplier_name, last_review_date, sla_met, incidents_count, evaluation_status |
| T5SharingAgreement | T5 | agreement_name, ioc_sharing_active, threat_intel_incorporated, authority_reporting_active |

### Tabelas de controlo
- **Evidence** — `(template_id, field_key, pillar, section, status: COLLECTED|MISSING|NA)`
- **ComplianceScore** — `(project_id, phase: T0-T5|GLOBAL, pillar: P1-P5|ALL, score: 0-100)`
- **Alert** — `(project_id, template_id, pillar, severity: CRITICAL|WARNING, rule_key, description, resolved_at)`
- **SectionExclusion** — `(template_id, section_key)` — secções marcadas N/A pelo utilizador

---

## 8. Motor de Alertas (alert_engine.py)

Regras implementadas por template:

| Template | Regra | Severidade | Pilar |
|----------|-------|-----------|-------|
| T1 | Fornecedor com contrato PENDING | WARNING | P4 |
| T1 | Impacto DORA não verificado | CRITICAL | P2 |
| T1 | IRP não em estado COMPLETE | WARNING | P2 |
| T1 | Risco OPEN + HIGH + sem mitigação | CRITICAL | pilar do risco |
| T1 | Risco OPEN + LOW/MEDIUM + sem mitigação | WARNING | pilar do risco |
| T2 | ADR sem aprovação Risk Manager | CRITICAL | P1 |
| T2 | Sem SLAs de fornecedores registados | WARNING | P2 |
| T3 | Pipeline scan com critical_vulns > 0 | CRITICAL | P1 |
| T3 | Nenhum scan registado | WARNING | P1 |
| T4 | TLPT aplicável mas não agendado | CRITICAL | P3 |
| T4 | Nenhum teste de resiliência | WARNING | P3 |
| T4 | Pen test com críticos por remediar | CRITICAL | P3 |
| T5 | Incidente não notificado em 4h | CRITICAL | P2 |
| T5 | Fornecedor T1 sem avaliação no T5 | WARNING | P4 |

---

## 9. Decisões de Design Relevantes

### Sem bloqueio de sprint por riscos abertos
Riscos OPEN não bloqueiam o fecho do sprint (contraria agilidade e frameworks como ISO 31000 que permitem riscos aceites formalmente). Em vez disso: alertas visuais + campo `acceptance_justification` obrigatório quando `status=ACCEPTED`.

### Sem transição automática de riscos entre sprints
Cada sprint começa com lista vazia. O revisor é responsável por re-registar riscos que continuam activos. Decisão consciente: evita complexidade de rastreio histórico fora do âmbito da dissertação.

### Ligação T2↔T4 unidirecional (T4→T2)
`T4SecurityTest.threat_ref` referencia ameaças do T2. O campo `test_ref` foi **removido** do `T2Threat` — seria preenchido retroativamente e semanticamente incorreto na fase de design. O sentido correto: o teste (T4) referencia a ameaça (T2).

### SectionNA como wrapper de Card
Antes: `<Card>` era filho de `SectionNA`, causando botão N/A a flutuar fora do card no DOM. Depois: `SectionNA` renderiza o `Card` internamente, `title` e `action` são props. Todos os templates T1–T5 usam este padrão.

### Score de conformidade
`score = evidências_COLLECTED / (total - NA) × 100`  
Evidências NA (pilar inativo ou secção excluída) são excluídas do denominador — não penalizam nem beneficiam o score.

---

## 10. Artigos DORA Implementados Explicitamente

| Artigo | Tema | Onde |
|--------|------|------|
| Art. 6 | Governação do risco ICT | Alertas T1 (riscos OPEN sem mitigação) |
| Art. 7 | Capacidade e patches dos sistemas TIC | T3 (`systems_capacity_assessed`, `patches_applied_or_planned`) + T5 (`systems_patches_current`) |
| Art. 9 | Gestão de continuidade de negócio | T5 (backup, restore, segregação) |
| Art. 12 | Políticas de backup e restore | T5 (`backup_restore_tested`, `backup_storage_segregated`) |
| Art. 14 | Plano de comunicação de crise | T5 (`crisis_comms_plan_tested`) |
| Art. 17 | Plano de Resposta a Incidentes | T1 (`incident_response_plan_status`) |
| Art. 19 | Notificação de incidentes em 4h | T5 (`notification_within_4h`) → alerta CRITICAL |
| Art. 25 | Testes de resiliência operacional | T4 (resilience tests, BCP/DR) |
| Art. 26 | TLPT obrigatório | T4 (`tlpt_applicable`, `tlpt_completed_or_scheduled`) |
| Art. 27 | Qualificação do testador TLPT | T4 (`tlpt_tester_certified`, `tlpt_tester_insured`) |
| Art. 28 | Avaliação de fornecedores | T5 (avaliação operacional) + alerta se fornecedor T1 não avaliado |
| Art. 30 | SLAs contratuais com terceiros | T2 (`T2SupplierSLA`, cláusulas de notificação) |
| Art. 49 | Exercícios cross-sector | T4 (`T4CrossSectorExercise`) |

---

## 11. Script de Teste (seed_scenario.py)

Ficheiro `seed_scenario.py` na raiz do projeto. Cria via API REST um projeto completo de teste:
- **Projeto:** "Core Banking – Migração Cloud" | Banco Atlântico S.A.
- **Pilares:** P1–P5 todos ativos
- **Sprints:** T1–T5 sprint 1, todos COMPLETE
- Exercita todos os campos DORA (Art. 7, 12, 14, 27, 49)
- Inclui dados intencionalmente imperfeitos para gerar alertas realistas

```bash
python seed_scenario.py                     # cria cenário
python seed_scenario.py --delete <id>       # limpa
```

---

## 12. Ficheiros Mais Relevantes para Contexto

| Ficheiro | Importância |
|----------|-------------|
| `backend/models.py` | Fonte da verdade do schema de dados |
| `backend/services/evidence_tracker.py` | Lógica de como campos → evidências |
| `backend/services/alert_engine.py` | Todas as regras de negócio DORA |
| `backend/services/compliance_calculator.py` | Fórmula do score |
| `frontend/src/api.ts` | Todos os tipos TypeScript e endpoints |
| `frontend/src/components/ui.tsx` | Design system completo |
| `frontend/src/components/SectionNA.tsx` | Padrão de secção N/A |
