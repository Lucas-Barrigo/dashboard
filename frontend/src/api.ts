import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export interface Project {
  id: number
  name: string
  institution: string
  responsible: string
  p1_active: boolean
  p2_active: boolean
  p3_active: boolean
  p4_active: boolean
  p5_active: boolean
  qualification_signed_by: string | null
  qualification_signed_at: string | null
  created_at: string
}

export interface ProjectCreate {
  name: string
  institution: string
  responsible: string
}

export interface PillarQuestion {
  question_key: string
  pillar: string
  question_text: string
  sort_order: number
}

export interface PillarAnswer {
  id: number
  project_id: number
  question_key: string
  answer: boolean
  answered_at: string
}

export interface ChecklistQuestion {
  id: number
  fase: string
  pillar: string
  dora_article: string
  topic_title: string
  control_description: string
  question_text: string
  sort_order: number
}

export interface ChecklistQuestionWithAnswer extends ChecklistQuestion {
  pillar_active: boolean
  answer: 'sim' | 'nao' | 'nao_aplicavel' | null
}

export interface ChecklistAnswer {
  id: number
  project_id: number
  question_id: number
  answer: 'sim' | 'nao' | 'nao_aplicavel' | null
  comment: string | null
  answered_by: string | null
  answered_at: string
}

export interface ChecklistSummary {
  total: number
  answered: number
  sim: number
  nao: number
  nao_aplicavel: number
  by_pillar: Array<{ pillar: string; total: number; answered: number; sim: number; nao: number; nao_aplicavel: number }>
  by_fase: Array<{ fase: string; total: number; answered: number; sim: number; nao: number; nao_aplicavel: number }>
}

// Projects API
export const projectsApi = {
  list: () => api.get<Project[]>('/projects/').then(r => r.data),
  create: (data: ProjectCreate) => api.post<Project>('/projects/', data).then(r => r.data),
  get: (id: number) => api.get<Project>(`/projects/${id}`).then(r => r.data),
  update: (id: number, data: Partial<ProjectCreate>) => api.put<Project>(`/projects/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/projects/${id}`),
}

// Qualification (Y0) API
export const qualificationApi = {
  getQuestions: (projectId: number) => api.get<PillarQuestion[]>(`/projects/${projectId}/qualification/questions`).then(r => r.data),
  getAnswers: (projectId: number) => api.get<PillarAnswer[]>(`/projects/${projectId}/qualification/answers`).then(r => r.data),
  submit: (projectId: number, answers: Array<{ question_key: string; answer: boolean }>) =>
    api.post<PillarAnswer[]>(`/projects/${projectId}/qualification/answers`, { answers }).then(r => r.data),
  sign: (projectId: number, signedBy: string) =>
    api.post<Project>(`/projects/${projectId}/qualification/sign`, { signed_by: signedBy }).then(r => r.data),
}

// Checklist API
export const checklistApi = {
  getQuestions: (projectId: number, fase?: string, pillar?: string) => {
    const params = new URLSearchParams()
    if (fase) params.append('fase', fase)
    if (pillar) params.append('pillar', pillar)
    const qs = params.toString() ? `?${params.toString()}` : ''
    return api.get<ChecklistQuestionWithAnswer[]>(`/projects/${projectId}/checklist${qs}`).then(r => r.data)
  },
  submitAnswer: (projectId: number, answer: { question_id: number; answer: 'sim' | 'nao' | 'nao_aplicavel' | null; comment?: string; answered_by?: string }) =>
    api.post<ChecklistAnswer>(`/projects/${projectId}/checklist/answers`, answer).then(r => r.data),
  getSummary: (projectId: number) => api.get<ChecklistSummary>(`/projects/${projectId}/checklist/summary`).then(r => r.data),
  getSignatures: (projectId: number) => api.get<any[]>(`/projects/${projectId}/checklist/signatures`).then(r => r.data),
  sign: (projectId: number, fase: string, signedBy: string) => api.post(`/projects/${projectId}/checklist/sign`, { fase, signed_by: signedBy }).then(r => r.data),
}

export default api
