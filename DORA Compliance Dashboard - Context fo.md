# DORA Compliance Dashboard — Context for Claude Code

## Project Overview

Build a **web application** for managing DORA (Digital Operational Resilience Act) compliance across software development projects. The app guides teams through a sequence of compliance templates aligned with the Software Development Life Cycle (SDLC), and aggregates the results into a compliance dashboard.

The application is intended for use by financial institutions (primary case study: Natixis) to ensure their software projects comply with EU Regulation 2022/2554 (DORA), which has been mandatory since January 2025.

---

## Core Concept

The app has two main components:

1. **Templates (T0–T5)** — structured forms filled in by development teams at each SDLC phase
2. **Dashboard** — aggregates template data and shows compliance levels, missing evidence, and alerts

The key design principle is **recursiveness**: what is filled in T0 determines what is shown and required in T1–T5. If a DORA pillar is not activated in T0, the corresponding sections in subsequent templates are hidden and marked as N/A — they do not count as missing evidence.

---

## The 5 DORA Pillars

| ID | Name | DORA Articles |
|----|------|---------------|
| P1 | ICT Risk Management | Art. 5–15 |
| P2 | Incident Management | Art. 17–23 |
| P3 | Digital Operational Resilience Testing | Art. 24–27 |
| P4 | Third-Party Risk Management | Art. 28–44 |
| P5 | Information Sharing | Art. 45–49 |

---

## Template Structure

### T0 — DORA Project Triage (pre-SDLC)
**Purpose:** Determine if the project is subject to DORA, which pillars apply, and the criticality level. This is the entry point — no project proceeds without a completed T0.

**Sections:**
1. **Project identification** — name, responsible person, date, methodology (Agile/Traditional/Hybrid), institution
2. **Pillar qualification** — for each of the 5 pillars, a set of Yes/No questions. If at least one answer is "Yes", the pillar is activated
3. **Criticality classification** — Critical / High / Medium / Low
4. **Triage result** — summary of activated pillars, criticality, approval

**Pillar qualification questions:**

- **P1:** System supports critical/important functions? | Processes financial or client data? | Involves changes to production infrastructure? | Introduces new technologies or architectures?
- **P2:** System will be in production and subject to continuous monitoring? | Failure could cause interruption of financial services? | System processes real-time transactions?
- **P3:** Project affects systems classified as critical? | Institution subject to mandatory TLPT for this system type? | Project introduces significant changes to existing systems?
- **P4:** Project involves external ICT suppliers? | Any supplier will have access to critical systems or data? | Project depends on cloud services or third-party infrastructure?
- **P5:** Institution participates in information sharing agreements? | Project involves systems where indicators of compromise must be reported to the sector?

**Output:** List of activated pillars → passed to all subsequent templates

---

### T1 — Requirements & Planning
**Applied:** At the start of each sprint
**Mandatory sections based on activated pillars:**

| Section | Condition |
|---------|-----------|
| Project identification | Always |
| Requirements & DORA compliance (User Stories + DORA impact check) | P1 active |
| ICT risk identification | P1 active |
| Incident response planning | P2 active |
| Third-party involvement | P4 active |
| Evidence for dashboard | Always |

**Key fields:**
- User Stories with security acceptance criteria (confidentiality, integrity, availability)
- DORA impact verification per sprint (affects critical systems? new ICT risks? changes to production? new third-party suppliers?)
- Risk register: risk ID, description, probability (H/M/L), impact (H/M/L), DORA pillar, mitigation
- Incident response plan status
- Third-party supplier details and contract status

---

### T2 — Design & Architecture
**Applied:** During design sprints
**Mandatory sections based on activated pillars:**

| Section | Condition |
|---------|-----------|
| Project identification | Always |
| Security architecture (Threat Modeling + Zero Trust) | P1 active |
| Resilience architecture | P1 or P2 active |
| Architectural Decision Records (ADRs) | P1 active |
| SLAs with ICT suppliers | P4 active |
| Evidence for dashboard | Always |

**Key fields:**
- Threat modeling using STRIDE methodology (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege)
- Zero Trust principles: mutual authentication between services, network micro-segmentation, least privilege access
- Resilience mechanisms: circuit breakers, failover, DRP, redundancy, backup strategy
- ADRs: decision, context, alternatives considered, security justification, DORA implications — requires Risk Manager approval
- Supplier SLAs: availability, incident notification clauses, audit rights

---

### T3 — Implementation
**Applied:** During each development sprint
**Mandatory sections based on activated pillars:**

| Section | Condition |
|---------|-----------|
| Project identification | Always |
| Secure coding practices | P1 active |
| Automated security testing in CI/CD pipeline | P1 active |
| Audit trail & logging | P1 or P2 active |
| Dependency & supply chain management | P1 active |
| Third-party verification | P4 active |
| Evidence for dashboard | Always |

**Key fields:**
- Secure coding: OWASP guidelines, code review, secrets management, input validation, auth mechanisms
- Pipeline security: SAST results (pass/fail), SCA results, IaC scanning — **CVSS ≥ 7.0 vulnerabilities block deployment**
- Logging: structured logging active, audit trail auto-generated, 7-year retention, tamper protection
- Dependencies: inventory updated, verified against vulnerability databases, authorized tools only
- Supplier access: monitored, SLA in force

---

### T4 — Testing
**Applied:** During validation phase
**Mandatory sections based on activated pillars:**

| Section | Condition |
|---------|-----------|
| Project identification | Always |
| Functional security testing | P1 active |
| Operational resilience testing (Pen testing + Resilience tests) | P3 active |
| Supplier failure simulation | P4 active |
| Compliance verification | Any pillar active |
| Evidence for dashboard | Always |

**Key fields:**
- Functional tests derived from T2 threat model (traceability TM-XX → TS-XX)
- Pen testing: date, responsible entity, scope, critical vulnerabilities, remediation, formal report
- TLPT: applicable? completed or scheduled? (mandatory for larger entities per Art. 26)
- Resilience tests: DR tests, BCP validation, chaos engineering, RTO measurement
- Supplier failure simulation: scenario tested, contingency procedure activated, result
- Compliance verification: audit trail integrity, incident response procedures tested, risk assessments validated

---

### T5 — Deployment & Operations
**Applied:** At deployment and periodically during operations
**Mandatory sections based on activated pillars:**

| Section | Condition |
|---------|-----------|
| Project identification | Always |
| Secure deployment | P1 active |
| Security monitoring & operations | P1 active |
| Incident management | P2 active |
| Supplier evaluation | P4 active |
| Information sharing | P5 active |
| Evidence for dashboard | Always |

**Key fields:**
- Deployment: pre-deployment security validation, system hardening (reducing attack surface — disabling unnecessary services, ports, default credentials), secrets rotation, post-deployment scanning, rollback plan
- Monitoring: SIEM active, infrastructure monitoring rules, threat intelligence feeds, continuous vulnerability assessment
- Incident management: response plan active, 4-hour notification procedure documented and tested (Art. 19), incident classification defined, competent authority contacts identified, post-mortem process defined
- Supplier evaluation: annual review completed, SLA met, incidents reported
- Information sharing: active sharing agreements, IoCs shared with sector, threat intelligence incorporated, reporting to competent authorities

---

## Dashboard Components

The dashboard aggregates all template data and displays:

### 1. Global Compliance Index
- Percentage calculated from: (completed mandatory evidence items) / (total expected evidence items) × 100
- Broken down by SDLC phase
- Based on PSPI concept (Caniglia et al., 2025)

### 2. Compliance by DORA Pillar
- Separate compliance percentage for each activated pillar
- Only activated pillars are shown (pillars not activated in T0 are hidden)

### 3. Evidence Panel
- List of all expected evidence items vs collected
- Status: Collected / Incomplete / Missing / N/A
- Grouped by template and pillar

### 4. Non-Compliance Alerts
- Automatically generated when mandatory evidence is missing or failed
- Severity: Critical / Warning
- Examples:
  - SAST results with unresolved CVSS ≥ 7.0 vulnerabilities → Critical
  - TLPT not scheduled for critical system → Critical
  - Incomplete threat model → Critical
  - Supplier due diligence pending → Warning

### 5. Audit Report Generation
- Export all evidence, compliance scores, and alerts
- Should include: project details, activated pillars, compliance % per phase and pillar, evidence list, open alerts, approval signatures

---

## Data Model (suggested)

```
Project
  - id, name, institution, responsible, methodology, created_at
  - criticality: CRITICAL | HIGH | MEDIUM | LOW
  - activated_pillars: [P1, P2, P3, P4, P5]
  - status: ACTIVE | COMPLETED

Template (T0–T5)
  - id, project_id, template_type (T0|T1|T2|T3|T4|T5)
  - sprint_number (for T1–T4)
  - filled_by, filled_at, approved_by, approved_at
  - status: NOT_STARTED | IN_PROGRESS | COMPLETE | INCOMPLETE

Evidence
  - id, template_id, pillar (P1–P5), field_name
  - status: COLLECTED | INCOMPLETE | MISSING | NA
  - value (the actual content)

Alert
  - id, project_id, template_id, pillar
  - severity: CRITICAL | WARNING
  - description, created_at, resolved_at

ComplianceScore
  - project_id, phase (T0–T5), pillar (P1–P5)
  - score (0–100), calculated_at
```

---

## Key Business Rules

1. **A project cannot proceed without a completed T0** — T0 is the entry point and defines everything else
2. **Templates are sequential** — T1 before T2, T2 before T3, etc.
3. **Sections not applicable to inactive pillars are hidden** — they do not appear in forms and do not count as missing evidence
4. **CVSS ≥ 7.0 unresolved vulnerabilities generate Critical alerts** — these should visually block the phase progress
5. **ADR approval by Risk Manager is a mandatory exit criterion for T2** — without it T2 cannot be marked complete
6. **T5 is the only template with a P5 section** — information sharing is only relevant in production
7. **All Yes/No fields are binary** — no "Planned" option exists to prevent teams from advancing without real compliance

---

## Tech Stack Suggestions

- **Frontend:** React or plain HTML/CSS/JS
- **Backend:** Node.js (Express) or Python (FastAPI/Flask)
- **Database:** SQLite (simple, file-based, no server needed) or PostgreSQL
- **Export:** PDF generation for audit reports (jsPDF or similar)
- **Deployment:** Single machine / localhost is sufficient for dissertation purposes

The app does not need authentication for dissertation purposes, but should support multiple projects simultaneously.

---

## Expected Deliverable

A functional web application where:
1. A user creates a project and fills in T0
2. Based on T0 results, T1–T5 show only the relevant sections
3. As templates are filled, the dashboard updates in real time
4. Non-compliance alerts are generated automatically
5. An audit report can be exported at any time

The application will be used to validate the approach against real completed projects at Natixis, by retroactively filling in the templates and observing the compliance scores generated by the dashboard.
