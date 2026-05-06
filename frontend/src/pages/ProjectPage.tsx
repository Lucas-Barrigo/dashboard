import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle, Clock, BarChart2, Lock } from 'lucide-react'
import { dashboardApi, type DashboardData, type PhaseStatus, type Evidence } from '../api'
import { Card, CardHeader, Badge, ScoreRing, Spinner, Table, Td, Empty, Modal } from '../components/ui'
import { Breadcrumbs } from '../components/Layout'

const PILLARS = ['P1', 'P2', 'P3', 'P4', 'P5']
const PILLAR_LABELS: Record<string, string> = {
  P1: 'ICT Risk Management',
  P2: 'Incident Management',
  P3: 'Resilience Testing',
  P4: 'Third-Party Risk',
  P5: 'Information Sharing',
}

const PHASE_PATHS: Record<string, string> = {
  T0: 't0', T1: 't1', T2: 't2', T3: 't3', T4: 't4', T5: 't5',
}

const DEFAULT_PHASES: PhaseStatus[] = [
  { phase: 'T0', label: 'Qualificação', status: null, locked: false, sprint_count: 0 },
  { phase: 'T1', label: 'Planeamento', status: null, locked: false, sprint_count: 0 },
  { phase: 'T2', label: 'Arquitetura', status: null, locked: false, sprint_count: 0 },
  { phase: 'T3', label: 'Implementação', status: null, locked: false, sprint_count: 0 },
  { phase: 'T4', label: 'Testes', status: null, locked: false, sprint_count: 0 },
  { phase: 'T5', label: 'Operações', status: null, locked: false, sprint_count: 0 },
]

const PHASE_DESC: Record<string, string> = {
  T0: 'Ativação de Pilares',
  T1: 'Requisitos & Risco ICT',
  T2: 'Arquitetura & Ameaças',
  T3: 'Pipeline DevSecOps',
  T4: 'Testes de Resiliência',
  T5: 'Incidentes & Partilha',
}

export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const pid = Number(projectId)
  const [data, setData] = useState<DashboardData | null>(null)
  const [phases, setPhases] = useState<PhaseStatus[]>(DEFAULT_PHASES)
  const [loading, setLoading] = useState(true)
  const [evidenceFilter, setEvidenceFilter] = useState<'COLLECTED' | 'MISSING' | null>(null)
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([])
  const [evidenceLoading, setEvidenceLoading] = useState(false)

  useEffect(() => {
    Promise.allSettled([dashboardApi.get(pid), dashboardApi.phases(pid)]).then(([d, p]) => {
      if (d.status === 'fulfilled') setData(d.value)
      if (p.status === 'fulfilled') setPhases(p.value)
      // if phases API fails, DEFAULT_PHASES keeps all templates accessible
      setLoading(false)
    })
  }, [pid])

  const openEvidenceModal = (filter: 'COLLECTED' | 'MISSING') => {
    setEvidenceFilter(filter)
    if (evidenceList.length === 0) {
      setEvidenceLoading(true)
      dashboardApi.evidence(pid).then(list => {
        setEvidenceList(list)
        setEvidenceLoading(false)
      })
    }
  }

  if (loading) return <Spinner />
  if (!data) return <p className="text-red-500">Projeto não encontrado.</p>

  const { project, compliance_scores, open_alerts, evidence_summary } = data
  const globalScore = compliance_scores.find(s => s.pillar === 'ALL' && s.phase === 'GLOBAL')?.score ?? 0

  const scoreMatrix: Record<string, Record<string, number>> = {}
  compliance_scores.forEach(s => {
    if (!scoreMatrix[s.phase]) scoreMatrix[s.phase] = {}
    scoreMatrix[s.phase][s.pillar] = s.score
  })

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Projetos', to: '/' }, { label: project.name }]} />

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{project.institution} · {project.responsible}</p>
          {project.criticality && <p className="text-xs text-gray-400 mt-0.5">Criticidade: {project.criticality}</p>}
        </div>
        <div className="flex flex-col items-center">
          <ScoreRing score={globalScore} size={88} />
          <span className="text-xs text-gray-500 mt-1">Score Global</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard icon={<AlertTriangle size={18} className="text-red-500" />} label="Alertas Abertos" value={open_alerts.length} />
        <KpiCard icon={<CheckCircle size={18} className="text-green-500" />} label="Evidências Coletadas" value={evidence_summary['COLLECTED'] ?? 0} onClick={() => openEvidenceModal('COLLECTED')} />
        <KpiCard icon={<Clock size={18} className="text-yellow-500" />} label="Evidências em Falta" value={(evidence_summary['INCOMPLETE'] ?? 0) + (evidence_summary['MISSING'] ?? 0)} onClick={() => openEvidenceModal('MISSING')} />
        <KpiCard icon={<BarChart2 size={18} className="text-indigo-500" />} label="Pilares Ativos" value={PILLARS.filter(p => project[`${p.toLowerCase()}_active` as keyof typeof project]).length} />
      </div>

      {/* Evidence modal */}
      {evidenceFilter && (
        <EvidenceModal
          filter={evidenceFilter}
          items={evidenceList}
          loading={evidenceLoading}
          onClose={() => setEvidenceFilter(null)}
        />
      )}

      {/* Phase pipeline */}
      {(
        <Card className="mb-6">
          <CardHeader title="Fases DevSecOps" />
          <div className="p-4 overflow-x-auto">
            <div className="flex items-stretch gap-0 min-w-max">
              {phases.map((phase, i) => (
                <div key={phase.phase} className="flex items-center">
                  <PhaseCard phase={phase} pid={pid} />
                  {i < phases.length - 1 && (
                    <div className={`w-8 h-0.5 shrink-0 ${phase.status === 'COMPLETE' ? 'bg-green-400' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Score matrix */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader title="Score por Fase × Pilar" />
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Fase</th>
                    {PILLARS.map(p => (
                      <th key={p} className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase">{p}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {phases.map(ph => (
                    <tr key={ph.phase}>
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-800">{ph.label}</span>
                        <span className="ml-2 text-xs text-gray-400 font-mono">{ph.phase}</span>
                      </td>
                      {PILLARS.map(pillar => {
                        const active = project[`${pillar.toLowerCase()}_active` as keyof typeof project]
                        if (!active) return <td key={pillar} className="px-3 py-3 text-center text-gray-300 text-xs">N/A</td>
                        const score = scoreMatrix[ph.phase]?.[pillar]
                        if (score == null) return <td key={pillar} className="px-3 py-3 text-center text-gray-300">–</td>
                        const color = score >= 80 ? 'text-green-700 bg-green-50' : score >= 50 ? 'text-yellow-700 bg-yellow-50' : 'text-red-700 bg-red-50'
                        return (
                          <td key={pillar} className="px-3 py-3 text-center">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${color}`}>{Math.round(score)}%</span>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Pilares */}
        <div>
          <Card>
            <CardHeader title="Pilares DORA" />
            <div className="p-4 space-y-2">
              {PILLARS.map(p => {
                const active = project[`${p.toLowerCase()}_active` as keyof typeof project] as boolean
                return (
                  <div key={p} className="flex items-center justify-between">
                    <span className="text-xs text-gray-700">{p} – {PILLAR_LABELS[p]}</span>
                    <Badge label={active ? 'COLLECTED' : 'NA'} />
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* Alerts */}
      {open_alerts.length > 0 && (
        <div className="mt-6">
          <Card>
            <CardHeader title={`Alertas Abertos (${open_alerts.length})`} />
            {open_alerts.length === 0 ? <Empty message="Sem alertas." /> : (
              <Table headers={['Severidade', 'Pilar', 'Regra', 'Descrição', 'Data']}>
                {open_alerts.map(a => (
                  <tr key={a.id}>
                    <Td><Badge label={a.severity} /></Td>
                    <Td className="text-xs">{a.pillar}</Td>
                    <Td className="font-mono text-xs">{a.rule_key}</Td>
                    <Td>{a.description}</Td>
                    <Td className="text-xs text-gray-400">{new Date(a.created_at).toLocaleDateString('pt-PT')}</Td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}

function PhaseCard({ phase, pid }: { phase: PhaseStatus; pid: number }) {
  const path = `/projects/${pid}/${PHASE_PATHS[phase.phase]}`

  const notStarted = { border: 'border-gray-200 bg-white', badge: 'text-gray-500 bg-gray-100', badgeText: 'Não iniciado', dot: 'bg-gray-300' }
  const statusStyles: Record<string, typeof notStarted> = {
    COMPLETE: { border: 'border-green-300 bg-green-50', badge: 'text-green-700 bg-green-100', badgeText: 'Concluído', dot: 'bg-green-500' },
    IN_PROGRESS: { border: 'border-indigo-300 bg-indigo-50', badge: 'text-indigo-700 bg-indigo-100', badgeText: 'Em curso', dot: 'bg-indigo-500' },
  }

  if (phase.locked) {
    return (
      <div className="w-36 border border-gray-200 rounded-xl p-3 bg-gray-50 opacity-50 select-none">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-gray-400">{phase.phase}</span>
          <Lock size={12} className="text-gray-400" />
        </div>
        <p className="text-sm font-semibold text-gray-400 leading-tight mb-1">{phase.label}</p>
        <p className="text-xs text-gray-400">{PHASE_DESC[phase.phase]}</p>
        <div className="mt-2">
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Bloqueado</span>
        </div>
      </div>
    )
  }

  const s = (phase.status ? statusStyles[phase.status] : undefined) ?? notStarted

  return (
    <Link to={path} className={`w-36 border ${s.border} rounded-xl p-3 hover:shadow-md transition-all block`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono text-gray-500">{phase.phase}</span>
        <div className={`w-2 h-2 rounded-full ${s.dot}`} />
      </div>
      <p className="text-sm font-semibold text-gray-800 leading-tight mb-1">{phase.label}</p>
      <p className="text-xs text-gray-500 mb-2">{PHASE_DESC[phase.phase]}</p>
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.badge}`}>{s.badgeText}</span>
    </Link>
  )
}

function KpiCard({ icon, label, value, onClick }: { icon: React.ReactNode; label: string; value: number; onClick?: () => void }) {
  const clickable = Boolean(onClick)
  return (
    <Card
      className={`p-4 flex items-center gap-3 ${clickable ? 'cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all' : ''}`}
      {...(onClick ? { onClick } : {})}
    >
      <div className="shrink-0">{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
        {clickable && <p className="text-xs text-indigo-500 mt-0.5">Ver detalhe →</p>}
      </div>
    </Card>
  )
}

const SECTION_LABELS: Record<string, string> = {
  devsecops_checklist: 'Checklist DevSecOps',
  pipeline_scans: 'Pipeline Scans',
  dependencies: 'Dependências',
  resilience_testing: 'Testes Resiliência',
  security_tests: 'Testes Segurança',
  pen_tests: 'Pen Tests',
  supplier_sims: 'Simulações Fornecedor',
  incidents: 'Incidentes',
  supplier_evaluations: 'Avaliações Fornecedor',
  sharing_agreements: 'Acordos Partilha',
  architecture_checklist: 'Checklist Arquitetura',
  threats: 'Ameaças STRIDE',
  adrs: 'ADRs',
  slas: 'SLAs',
  user_stories: 'User Stories',
  risks: 'Riscos',
  suppliers: 'Fornecedores',
  pillar_activation: 'Ativação Pilares',
  deploy_checklist: 'Checklist Deploy',
}

function fmtKey(key: string) {
  return SECTION_LABELS[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function EvidenceModal({
  filter,
  items,
  loading,
  onClose,
}: {
  filter: 'COLLECTED' | 'MISSING'
  items: Evidence[]
  loading: boolean
  onClose: () => void
}) {
  const filtered = items.filter(e =>
    filter === 'COLLECTED' ? e.status === 'COLLECTED' : e.status === 'MISSING' || e.status === 'INCOMPLETE'
  )
  const title = filter === 'COLLECTED'
    ? `Evidências Coletadas (${filtered.length})`
    : `Evidências em Falta (${filtered.length})`

  return (
    <Modal title={title} onClose={onClose} size="lg">
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-8">Sem evidências.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead>
              <tr>
                {['Fase', 'Pilar', 'Secção', 'Campo', 'Estado', 'Atualizado'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(e => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-xs font-mono text-gray-500">
                    {e.phase}{e.sprint_number ? ` / S${e.sprint_number}` : ''}
                  </td>
                  <td className="px-3 py-2 text-xs font-mono text-gray-600">{e.pillar}</td>
                  <td className="px-3 py-2 text-xs text-gray-700">{fmtKey(e.section)}</td>
                  <td className="px-3 py-2 text-xs text-gray-700">{fmtKey(e.field_key)}</td>
                  <td className="px-3 py-2"><Badge label={e.status} /></td>
                  <td className="px-3 py-2 text-xs text-gray-400">{new Date(e.updated_at).toLocaleDateString('pt-PT')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  )
}
