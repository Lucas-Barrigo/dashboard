import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export default api

// ── Types ──────────────────────────────────────────────────────────────────

export interface Project {
  id: number
  name: string
  institution: string
  responsible: string
  sprint_duration_days: number
  criticality: string | null
  p1_active: boolean
  p2_active: boolean
  p3_active: boolean
  p4_active: boolean
  p5_active: boolean
  status: string
  created_at: string
  updated_at: string
}

export interface ProjectCreate {
  name: string
  institution: string
  responsible: string
  sprint_duration_days?: number
  criticality?: string
}

export interface Template {
  id: number
  project_id: number
  type: string
  sprint_number: number | null
  status: 'IN_PROGRESS' | 'COMPLETE'
  filled_by: string | null
  filled_at: string | null
  approved_by: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
}

export interface ComplianceScore {
  id: number
  project_id: number
  phase: string
  pillar: string
  score: number
  calculated_at: string
}

export interface Alert {
  id: number
  project_id: number
  template_id: number
  pillar: string
  severity: 'HIGH' | 'MEDIUM' | 'LOW'
  rule_key: string
  description: string
  created_at: string
  resolved_at: string | null
}

export interface Evidence {
  id: number
  template_id: number
  pillar: string
  section: string
  field_key: string
  status: 'COLLECTED' | 'INCOMPLETE' | 'MISSING' | 'NA'
  updated_at: string
  phase: string
  sprint_number: number | null
}

export interface DashboardData {
  project: Project
  compliance_scores: ComplianceScore[]
  open_alerts: Alert[]
  evidence_summary: Record<string, number>
}

export interface PhaseStatus {
  phase: string
  label: string
  status: 'COMPLETE' | 'IN_PROGRESS' | null
  locked: boolean
  sprint_count: number
}

// T0
export interface PillarQuestion {
  question_key: string
  pillar: string
  question_text: string
  sort_order: number
}

export interface T0Answer {
  id: number
  template_id: number
  pillar: string
  question_key: string
  answer: boolean
}

// T1
export interface T1Data {
  template_id: number
  incident_response_plan_status: string | null
  dora_impact_verified: boolean
  notes: string | null
}

export interface T1UserStory {
  id: number
  template_id: number
  story_ref: string
  description: string
  affects_critical_system: boolean
  introduces_ict_risk: boolean
  production_change: boolean
  new_third_party: boolean
  criteria_confidentiality: string | null
  criteria_integrity: string | null
  criteria_availability: string | null
}

export interface T1Risk {
  id: number
  template_id: number
  risk_ref: string
  description: string
  probability: 'LOW' | 'MEDIUM' | 'HIGH'
  impact: 'LOW' | 'MEDIUM' | 'HIGH'
  pillar: string
  mitigation: string | null
  status: 'OPEN' | 'MITIGATED' | 'ACCEPTED'
}

export interface T1Supplier {
  id: number
  template_id: number
  supplier_name: string
  service_description: string | null
  contract_status: string | null
  critical_system_access: boolean
}

// T2
export interface T2Data {
  template_id: number
  zero_trust_mutual_auth: boolean
  zero_trust_segmentation: boolean
  zero_trust_least_privilege: boolean
  circuit_breakers: boolean
  failover_configured: boolean
  drp_documented: boolean
  redundancy_configured: boolean
  backup_strategy_defined: boolean
  notes: string | null
}

export interface T2Threat {
  id: number
  template_id: number
  threat_ref: string
  stride_category: string
  description: string
  affected_asset: string | null
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  mitigation: string | null
  test_ref: string | null
}

export interface T2ADR {
  id: number
  template_id: number
  adr_ref: string
  decision: string
  context: string | null
  alternatives: string | null
  security_justification: string | null
  dora_implications: string | null
  risk_mgr_approved: boolean
  approved_at: string | null
}

export interface T2SupplierSLA {
  id: number
  template_id: number
  supplier_name: string
  availability_sla: string | null
  incident_notification_clause: boolean
  audit_rights: boolean
  sla_status: 'MET' | 'BREACHED' | 'AT_RISK' | null
}

// T3
export interface T3Data {
  template_id: number
  owasp_guidelines_followed: boolean
  code_review_completed: boolean
  secrets_management_active: boolean
  input_validation_active: boolean
  auth_mechanisms_documented: boolean
  structured_logging_active: boolean
  audit_trail_auto_generated: boolean
  log_retention_7yr: boolean
  tamper_protection_active: boolean
  dependency_inventory_updated: boolean
  supplier_access_monitored: boolean
  notes: string | null
}

export interface T3PipelineScan {
  id: number
  template_id: number
  scan_type: 'SAST' | 'SCA' | 'IAC' | 'DAST'
  pipeline_stage: 'BUILD' | 'TEST' | 'DEPLOY'
  environment: 'DEV' | 'STAGING' | 'PROD'
  tool_used: string | null
  scan_date: string | null
  result: 'PASS' | 'FAIL' | 'PARTIAL'
  critical_vulns: number
  report_ref: string | null
}

export interface T3Dependency {
  id: number
  template_id: number
  package_name: string
  version: string | null
  cve_id: string | null
  cvss_score: number | null
  status: 'OK' | 'VULNERABLE' | 'PATCHED' | 'PENDING'
}

// T4
export interface T4Data {
  template_id: number
  tlpt_applicable: boolean
  tlpt_completed_or_scheduled: boolean
  tlpt_date: string | null
  audit_trail_integrity_verified: boolean
  incident_response_tested: boolean
  risk_assessments_validated: boolean
  notes: string | null
}

export interface T4SecurityTest {
  id: number
  template_id: number
  test_ref: string
  threat_ref: string | null
  description: string
  result: 'PASS' | 'FAIL' | 'PARTIAL'
  evidence_ref: string | null
}

export interface T4PenTest {
  id: number
  template_id: number
  test_date: string | null
  responsible_entity: string | null
  scope: string | null
  critical_vulns_found: number
  critical_vulns_remediated: number
  formal_report_ref: string | null
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETE' | 'CANCELLED'
}

export interface T4ResilienceTest {
  id: number
  template_id: number
  test_type: string
  test_date: string | null
  rto_target: string | null
  rto_achieved: string | null
  result: 'PASS' | 'FAIL' | 'PARTIAL'
  notes: string | null
}

export interface T4SupplierFailureSim {
  id: number
  template_id: number
  supplier_name: string
  scenario_description: string | null
  contingency_activated: boolean
  result: 'PASS' | 'FAIL' | 'PARTIAL'
}

// T5
export interface T5Data {
  template_id: number
  pre_deploy_security_validated: boolean
  system_hardening_completed: boolean
  secrets_rotated: boolean
  post_deploy_scan_done: boolean
  rollback_plan_documented: boolean
  siem_active: boolean
  infra_monitoring_rules_defined: boolean
  threat_intelligence_feeds_active: boolean
  continuous_vuln_assessment_active: boolean
  incident_response_plan_active: boolean
  notification_4h_documented: boolean
  notification_4h_tested: boolean
  incident_classification_defined: boolean
  authority_contacts_identified: boolean
  post_mortem_process_defined: boolean
  notes: string | null
}

export interface T5Incident {
  id: number
  template_id: number
  incident_ref: string
  classification: string | null
  detected_at: string
  notified_at: string | null
  notification_within_4h: boolean
  authority_notified: string | null
  post_mortem_completed: boolean
  status: 'OPEN' | 'RESOLVED' | 'CLOSED'
}

export interface T5SupplierEvaluation {
  id: number
  template_id: number
  supplier_name: string
  last_review_date: string | null
  sla_met: boolean
  incidents_count: number
  evaluation_status: 'COMPLIANT' | 'NON_COMPLIANT' | 'AT_RISK' | 'PENDING'
}

export interface T5SharingAgreement {
  id: number
  template_id: number
  agreement_name: string
  ioc_sharing_active: boolean
  threat_intel_incorporated: boolean
  authority_reporting_active: boolean
}

// ── API calls ─────────────────────────────────────────────────────────────

export const projectsApi = {
  list: () => api.get<Project[]>('/projects/').then(r => r.data),
  get: (id: number) => api.get<Project>(`/projects/${id}`).then(r => r.data),
  create: (data: ProjectCreate) => api.post<Project>('/projects/', data).then(r => r.data),
  update: (id: number, data: Partial<ProjectCreate>) => api.put<Project>(`/projects/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/projects/${id}`),
}

export const dashboardApi = {
  get: (pid: number) => api.get<DashboardData>(`/projects/${pid}/dashboard/`).then(r => r.data),
  scores: (pid: number) => api.get<ComplianceScore[]>(`/projects/${pid}/dashboard/scores`).then(r => r.data),
  alerts: (pid: number, openOnly = true) =>
    api.get<Alert[]>(`/projects/${pid}/dashboard/alerts`, { params: { open_only: openOnly } }).then(r => r.data),
  evidence: (pid: number) => api.get<Evidence[]>(`/projects/${pid}/dashboard/evidence`).then(r => r.data),
  phases: (pid: number) => api.get<PhaseStatus[]>(`/projects/${pid}/dashboard/phases`).then(r => r.data),
}

export const t0Api = {
  questions: (pid: number) =>
    api.get<PillarQuestion[]>(`/projects/${pid}/t0/questions`).then(r => r.data),
  create: (pid: number) => api.post<Template>(`/projects/${pid}/t0/`).then(r => r.data),
  get: (pid: number) => api.get<Template>(`/projects/${pid}/t0/`).then(r => r.data),
  answers: (pid: number) => api.get<T0Answer[]>(`/projects/${pid}/t0/answers`).then(r => r.data),
  saveAnswers: (pid: number, answers: { question_key: string; answer: boolean }[], filled_by?: string) =>
    api.post(`/projects/${pid}/t0/answers`, { answers, filled_by }).then(r => r.data),
  approve: (pid: number, approved_by: string) =>
    api.post<Template>(`/projects/${pid}/t0/approve`, { approved_by }).then(r => r.data),
}

const sprintBase = (base: string) => ({
  list: (pid: number) => api.get<Template[]>(`/projects/${pid}/${base}/`).then(r => r.data),
  create: (pid: number, sprint_number: number) =>
    api.post<Template>(`/projects/${pid}/${base}/`, null, { params: { sprint_number } }).then(r => r.data),
  get: (pid: number, sprint: number) => api.get<Template>(`/projects/${pid}/${base}/${sprint}`).then(r => r.data),
  approve: (pid: number, sprint: number, approved_by: string) =>
    api.post<Template>(`/projects/${pid}/${base}/${sprint}/approve`, { approved_by }).then(r => r.data),
})

export const t1Api = {
  ...sprintBase('t1'),
  getData: (pid: number, sprint: number) => api.get<T1Data>(`/projects/${pid}/t1/${sprint}/data`).then(r => r.data),
  saveData: (pid: number, sprint: number, data: Partial<T1Data>) =>
    api.put<T1Data>(`/projects/${pid}/t1/${sprint}/data`, data).then(r => r.data),
  stories: (pid: number, sprint: number) => api.get<T1UserStory[]>(`/projects/${pid}/t1/${sprint}/stories`).then(r => r.data),
  addStory: (pid: number, sprint: number, data: Partial<T1UserStory>) =>
    api.post<T1UserStory>(`/projects/${pid}/t1/${sprint}/stories`, data).then(r => r.data),
  deleteStory: (pid: number, sprint: number, id: number) => api.delete(`/projects/${pid}/t1/${sprint}/stories/${id}`),
  risks: (pid: number, sprint: number) => api.get<T1Risk[]>(`/projects/${pid}/t1/${sprint}/risks`).then(r => r.data),
  addRisk: (pid: number, sprint: number, data: Partial<T1Risk>) =>
    api.post<T1Risk>(`/projects/${pid}/t1/${sprint}/risks`, data).then(r => r.data),
  updateRisk: (pid: number, sprint: number, id: number, data: Partial<T1Risk>) =>
    api.put<T1Risk>(`/projects/${pid}/t1/${sprint}/risks/${id}`, data).then(r => r.data),
  deleteRisk: (pid: number, sprint: number, id: number) => api.delete(`/projects/${pid}/t1/${sprint}/risks/${id}`),
  suppliers: (pid: number, sprint: number) => api.get<T1Supplier[]>(`/projects/${pid}/t1/${sprint}/suppliers`).then(r => r.data),
  addSupplier: (pid: number, sprint: number, data: Partial<T1Supplier>) =>
    api.post<T1Supplier>(`/projects/${pid}/t1/${sprint}/suppliers`, data).then(r => r.data),
  deleteSupplier: (pid: number, sprint: number, id: number) => api.delete(`/projects/${pid}/t1/${sprint}/suppliers/${id}`),
}

export const t2Api = {
  ...sprintBase('t2'),
  getData: (pid: number, sprint: number) => api.get<T2Data>(`/projects/${pid}/t2/${sprint}/data`).then(r => r.data),
  saveData: (pid: number, sprint: number, data: Partial<T2Data>) =>
    api.put<T2Data>(`/projects/${pid}/t2/${sprint}/data`, data).then(r => r.data),
  threats: (pid: number, sprint: number) => api.get<T2Threat[]>(`/projects/${pid}/t2/${sprint}/threats`).then(r => r.data),
  addThreat: (pid: number, sprint: number, data: Partial<T2Threat>) =>
    api.post<T2Threat>(`/projects/${pid}/t2/${sprint}/threats`, data).then(r => r.data),
  deleteThreat: (pid: number, sprint: number, id: number) => api.delete(`/projects/${pid}/t2/${sprint}/threats/${id}`),
  adrs: (pid: number, sprint: number) => api.get<T2ADR[]>(`/projects/${pid}/t2/${sprint}/adrs`).then(r => r.data),
  addAdr: (pid: number, sprint: number, data: Partial<T2ADR>) =>
    api.post<T2ADR>(`/projects/${pid}/t2/${sprint}/adrs`, data).then(r => r.data),
  approveAdr: (pid: number, sprint: number, adrId: number, approved_by: string, approved_at: string) =>
    api.post<T2ADR>(`/projects/${pid}/t2/${sprint}/adrs/${adrId}/approve`, { approved_by, approved_at }).then(r => r.data),
  deleteAdr: (pid: number, sprint: number, id: number) => api.delete(`/projects/${pid}/t2/${sprint}/adrs/${id}`),
  slas: (pid: number, sprint: number) => api.get<T2SupplierSLA[]>(`/projects/${pid}/t2/${sprint}/slas`).then(r => r.data),
  addSla: (pid: number, sprint: number, data: Partial<T2SupplierSLA>) =>
    api.post<T2SupplierSLA>(`/projects/${pid}/t2/${sprint}/slas`, data).then(r => r.data),
  deleteSla: (pid: number, sprint: number, id: number) => api.delete(`/projects/${pid}/t2/${sprint}/slas/${id}`),
}

export const t3Api = {
  ...sprintBase('t3'),
  getData: (pid: number, sprint: number) => api.get<T3Data>(`/projects/${pid}/t3/${sprint}/data`).then(r => r.data),
  saveData: (pid: number, sprint: number, data: Partial<T3Data>) =>
    api.put<T3Data>(`/projects/${pid}/t3/${sprint}/data`, data).then(r => r.data),
  scans: (pid: number, sprint: number) => api.get<T3PipelineScan[]>(`/projects/${pid}/t3/${sprint}/scans`).then(r => r.data),
  addScan: (pid: number, sprint: number, data: Partial<T3PipelineScan>) =>
    api.post<T3PipelineScan>(`/projects/${pid}/t3/${sprint}/scans`, data).then(r => r.data),
  deleteScan: (pid: number, sprint: number, id: number) => api.delete(`/projects/${pid}/t3/${sprint}/scans/${id}`),
  dependencies: (pid: number, sprint: number) =>
    api.get<T3Dependency[]>(`/projects/${pid}/t3/${sprint}/dependencies`).then(r => r.data),
  addDependency: (pid: number, sprint: number, data: Partial<T3Dependency>) =>
    api.post<T3Dependency>(`/projects/${pid}/t3/${sprint}/dependencies`, data).then(r => r.data),
  deleteDependency: (pid: number, sprint: number, id: number) =>
    api.delete(`/projects/${pid}/t3/${sprint}/dependencies/${id}`),
}

export const t4Api = {
  ...sprintBase('t4'),
  getData: (pid: number, sprint: number) => api.get<T4Data>(`/projects/${pid}/t4/${sprint}/data`).then(r => r.data),
  saveData: (pid: number, sprint: number, data: Partial<T4Data>) =>
    api.put<T4Data>(`/projects/${pid}/t4/${sprint}/data`, data).then(r => r.data),
  securityTests: (pid: number, sprint: number) =>
    api.get<T4SecurityTest[]>(`/projects/${pid}/t4/${sprint}/security-tests`).then(r => r.data),
  addSecurityTest: (pid: number, sprint: number, data: Partial<T4SecurityTest>) =>
    api.post<T4SecurityTest>(`/projects/${pid}/t4/${sprint}/security-tests`, data).then(r => r.data),
  deleteSecurityTest: (pid: number, sprint: number, id: number) =>
    api.delete(`/projects/${pid}/t4/${sprint}/security-tests/${id}`),
  penTests: (pid: number, sprint: number) =>
    api.get<T4PenTest[]>(`/projects/${pid}/t4/${sprint}/pen-tests`).then(r => r.data),
  addPenTest: (pid: number, sprint: number, data: Partial<T4PenTest>) =>
    api.post<T4PenTest>(`/projects/${pid}/t4/${sprint}/pen-tests`, data).then(r => r.data),
  deletePenTest: (pid: number, sprint: number, id: number) =>
    api.delete(`/projects/${pid}/t4/${sprint}/pen-tests/${id}`),
  resilienceTests: (pid: number, sprint: number) =>
    api.get<T4ResilienceTest[]>(`/projects/${pid}/t4/${sprint}/resilience-tests`).then(r => r.data),
  addResilienceTest: (pid: number, sprint: number, data: Partial<T4ResilienceTest>) =>
    api.post<T4ResilienceTest>(`/projects/${pid}/t4/${sprint}/resilience-tests`, data).then(r => r.data),
  deleteResilienceTest: (pid: number, sprint: number, id: number) =>
    api.delete(`/projects/${pid}/t4/${sprint}/resilience-tests/${id}`),
  supplierSims: (pid: number, sprint: number) =>
    api.get<T4SupplierFailureSim[]>(`/projects/${pid}/t4/${sprint}/supplier-sims`).then(r => r.data),
  addSupplierSim: (pid: number, sprint: number, data: Partial<T4SupplierFailureSim>) =>
    api.post<T4SupplierFailureSim>(`/projects/${pid}/t4/${sprint}/supplier-sims`, data).then(r => r.data),
  deleteSupplierSim: (pid: number, sprint: number, id: number) =>
    api.delete(`/projects/${pid}/t4/${sprint}/supplier-sims/${id}`),
}

export const t5Api = {
  ...sprintBase('t5'),
  getData: (pid: number, sprint: number) => api.get<T5Data>(`/projects/${pid}/t5/${sprint}/data`).then(r => r.data),
  saveData: (pid: number, sprint: number, data: Partial<T5Data>) =>
    api.put<T5Data>(`/projects/${pid}/t5/${sprint}/data`, data).then(r => r.data),
  incidents: (pid: number, sprint: number) =>
    api.get<T5Incident[]>(`/projects/${pid}/t5/${sprint}/incidents`).then(r => r.data),
  addIncident: (pid: number, sprint: number, data: Partial<T5Incident>) =>
    api.post<T5Incident>(`/projects/${pid}/t5/${sprint}/incidents`, data).then(r => r.data),
  deleteIncident: (pid: number, sprint: number, id: number) =>
    api.delete(`/projects/${pid}/t5/${sprint}/incidents/${id}`),
  supplierEvals: (pid: number, sprint: number) =>
    api.get<T5SupplierEvaluation[]>(`/projects/${pid}/t5/${sprint}/supplier-evaluations`).then(r => r.data),
  addSupplierEval: (pid: number, sprint: number, data: Partial<T5SupplierEvaluation>) =>
    api.post<T5SupplierEvaluation>(`/projects/${pid}/t5/${sprint}/supplier-evaluations`, data).then(r => r.data),
  deleteSupplierEval: (pid: number, sprint: number, id: number) =>
    api.delete(`/projects/${pid}/t5/${sprint}/supplier-evaluations/${id}`),
  sharingAgreements: (pid: number, sprint: number) =>
    api.get<T5SharingAgreement[]>(`/projects/${pid}/t5/${sprint}/sharing-agreements`).then(r => r.data),
  addSharingAgreement: (pid: number, sprint: number, data: Partial<T5SharingAgreement>) =>
    api.post<T5SharingAgreement>(`/projects/${pid}/t5/${sprint}/sharing-agreements`, data).then(r => r.data),
  deleteSharingAgreement: (pid: number, sprint: number, id: number) =>
    api.delete(`/projects/${pid}/t5/${sprint}/sharing-agreements/${id}`),
}
