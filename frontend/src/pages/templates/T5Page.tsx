import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Trash2, Plus } from 'lucide-react'
import { t5Api, projectsApi, type Project, type Template, type T5Data, type T5Incident, type T5SupplierEvaluation, type T5SharingAgreement } from '../../api'
import {
  Card, CardHeader, Button, Input, Select, Textarea, FormField,
  Checkbox, Badge, Modal, Table, Td, Spinner, Empty,
} from '../../components/ui'
import { Breadcrumbs } from '../../components/Layout'
import SprintSelector from '../../components/SprintSelector'

export default function T5Page() {
  const { projectId } = useParams<{ projectId: string }>()
  const pid = Number(projectId)
  const [templates, setTemplates] = useState<Template[]>([])
  const [project, setProject] = useState<Project | null>(null)
  const [sprint, setSprint] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const loadTemplates = async () => {
    const [ts, proj] = await Promise.all([t5Api.list(pid), projectsApi.get(pid)])
    setTemplates(ts)
    setProject(proj)
    if (ts.length > 0 && sprint === null) setSprint(ts[ts.length - 1].sprint_number!)
    setLoading(false)
  }
  useEffect(() => { loadTemplates() }, [pid])

  if (loading) return <Spinner />
  const current = templates.find(t => t.sprint_number === sprint) ?? null

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Projetos', to: '/' }, { label: 'Projeto', to: `/projects/${pid}` }, { label: 'T5 – Incidentes & Partilha' }]} />
      <h1 className="text-2xl font-bold text-gray-900 mb-1">T5 – Gestão de Incidentes & Partilha de Informação</h1>
      <p className="text-sm text-gray-500 mb-4">Deploy seguro, SIEM, incidentes, avaliações e acordos de partilha por sprint</p>
      <SprintSelector templates={templates} selected={sprint} onSelect={setSprint}
        onCreate={async n => { await t5Api.create(pid, n); await loadTemplates(); setSprint(n) }} />
      {sprint && current
        ? <T5Content pid={pid} sprint={sprint} template={current} locked={current.status === 'COMPLETE'} onRefresh={loadTemplates}
            p2Active={project?.p2_active ?? true} p4Active={project?.p4_active ?? true} p5Active={project?.p5_active ?? true} />
        : <Empty message="Selecione ou crie um sprint." />}
    </div>
  )
}

function T5Content({ pid, sprint, template, locked, onRefresh, p2Active, p4Active, p5Active }: { pid: number; sprint: number; template: Template; locked: boolean; onRefresh: () => void; p2Active: boolean; p4Active: boolean; p5Active: boolean }) {
  const [data, setData] = useState<T5Data | null>(null)
  const [incidents, setIncidents] = useState<T5Incident[]>([])
  const [evals, setEvals] = useState<T5SupplierEvaluation[]>([])
  const [agreements, setAgreements] = useState<T5SharingAgreement[]>([])
  const [saving, setSaving] = useState(false)
  const [approveModal, setApproveModal] = useState(false)
  const [approver, setApprover] = useState('')
  const [modals, setModals] = useState({ inc: false, eval: false, ag: false })

  const load = async () => {
    const [d, i, e, a] = await Promise.allSettled([
      t5Api.getData(pid, sprint), t5Api.incidents(pid, sprint),
      t5Api.supplierEvals(pid, sprint), t5Api.sharingAgreements(pid, sprint),
    ])
    if (d.status === 'fulfilled') setData(d.value)
    else setData({ template_id: 0, pre_deploy_security_validated: false, system_hardening_completed: false, secrets_rotated: false, post_deploy_scan_done: false, rollback_plan_documented: false, siem_active: false, infra_monitoring_rules_defined: false, threat_intelligence_feeds_active: false, continuous_vuln_assessment_active: false, incident_response_plan_active: false, notification_4h_documented: false, notification_4h_tested: false, incident_classification_defined: false, authority_contacts_identified: false, post_mortem_process_defined: false, notes: null })
    if (i.status === 'fulfilled') setIncidents(i.value)
    if (e.status === 'fulfilled') setEvals(e.value)
    if (a.status === 'fulfilled') setAgreements(a.value)
  }
  useEffect(() => { load() }, [pid, sprint])

  const saveData = async () => { if (!data) return; setSaving(true); await t5Api.saveData(pid, sprint, data); setSaving(false) }
  const initData = async () => {
    const d = await t5Api.saveData(pid, sprint, {
      pre_deploy_security_validated: false, system_hardening_completed: false, secrets_rotated: false,
      post_deploy_scan_done: false, rollback_plan_documented: false, siem_active: false,
      infra_monitoring_rules_defined: false, threat_intelligence_feeds_active: false,
      continuous_vuln_assessment_active: false, incident_response_plan_active: false,
      notification_4h_documented: false, notification_4h_tested: false,
      incident_classification_defined: false, authority_contacts_identified: false,
      post_mortem_process_defined: false,
    })
    setData(d)
  }
  const approve = async () => { if (!approver.trim()) return; await t5Api.approve(pid, sprint, approver); setApproveModal(false); onRefresh() }

  const boolField = (key: keyof T5Data, label: string) => (
    <Checkbox key={key} label={label} checked={(data?.[key] as boolean) ?? false}
      onChange={v => setData(d => d && { ...d, [key]: v })} />
  )

  const violations = incidents.filter(i => !i.notification_within_4h).length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge label={template.status} />
          {violations > 0 && <span className="text-xs text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded">{violations} violação(ões) 4h</span>}
        </div>
        {!locked && <Button onClick={() => setApproveModal(true)}>Fechar Sprint</Button>}
        {locked && <span className="text-sm text-green-700">Aprovado por {template.approved_by}</span>}
      </div>

      <Card>
        <CardHeader title="Checklist de Deploy & Operações" />
        <div className="p-5">
          <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Segurança no Deploy</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {boolField('pre_deploy_security_validated', 'Segurança pré-deploy validada')}
                  {boolField('system_hardening_completed', 'Hardening do sistema concluído')}
                  {boolField('secrets_rotated', 'Secrets rotacionados')}
                  {boolField('post_deploy_scan_done', 'Scan pós-deploy realizado')}
                  {boolField('rollback_plan_documented', 'Plano de rollback documentado')}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Monitorização & Inteligência</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {boolField('siem_active', 'SIEM ativo')}
                  {boolField('infra_monitoring_rules_defined', 'Regras de monitorização de infra definidas')}
                  {boolField('threat_intelligence_feeds_active', 'Feeds de threat intelligence ativos')}
                  {boolField('continuous_vuln_assessment_active', 'Avaliação contínua de vulnerabilidades ativa')}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Resposta a Incidentes</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {boolField('incident_response_plan_active', 'Plano de resposta a incidentes ativo')}
                  {boolField('notification_4h_documented', 'Notificação 4h documentada')}
                  {boolField('notification_4h_tested', 'Notificação 4h testada')}
                  {boolField('incident_classification_defined', 'Classificação de incidentes definida')}
                  {boolField('authority_contacts_identified', 'Contactos de autoridade identificados')}
                  {boolField('post_mortem_process_defined', 'Processo de post-mortem definido')}
                </div>
              </div>
              <FormField label="Notas"><Textarea value={data?.notes ?? ''} disabled={locked} onChange={e => setData(d => d && { ...d, notes: e.target.value })} /></FormField>
              {!locked && <Button variant="secondary" onClick={saveData} disabled={saving}>{saving ? 'A guardar...' : 'Guardar'}</Button>}
            </div>
        </div>
      </Card>

      {p2Active ? (
        <Card>
          <CardHeader title="Incidentes ICT" action={!locked && <Button size="sm" onClick={() => setModals(m => ({ ...m, inc: true }))}><Plus size={14} /> Adicionar</Button>} />
          {incidents.length === 0 ? <Empty message="Nenhum incidente registado." /> : (
            <Table headers={['Ref', 'Classif.', 'Detetado', 'Notif. 4h', 'Autoridade', 'Post-mortem', 'Status', '']}>
              {incidents.map(i => (
                <tr key={i.id}>
                  <Td className="font-mono text-xs">{i.incident_ref}</Td>
                  <Td className="text-xs">{i.classification ?? '–'}</Td>
                  <Td className="text-xs text-gray-500">{new Date(i.detected_at).toLocaleDateString('pt-PT')}</Td>
                  <Td><Badge label={i.notification_within_4h ? 'PASS' : 'FAIL'} /></Td>
                  <Td><Badge label={i.authority_notified ? 'COLLECTED' : 'MISSING'} /></Td>
                  <Td><Badge label={i.post_mortem_completed ? 'COLLECTED' : 'MISSING'} /></Td>
                  <Td><Badge label={i.status} /></Td>
                  <Td>{!locked && <button onClick={async () => { await t5Api.deleteIncident(pid, sprint, i.id); load() }} className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button>}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      ) : <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-3 text-sm text-gray-400">P2 – Incident Management não ativo (N/A)</div>}

      {p4Active ? (
        <Card>
          <CardHeader title="Avaliações de Fornecedores" action={!locked && <Button size="sm" onClick={() => setModals(m => ({ ...m, eval: true }))}><Plus size={14} /> Adicionar</Button>} />
          {evals.length === 0 ? <Empty message="Nenhuma avaliação registada." /> : (
            <Table headers={['Fornecedor', 'Última Rev.', 'SLA Cumprido', 'Incidentes', 'Status', '']}>
              {evals.map(e => (
                <tr key={e.id}>
                  <Td>{e.supplier_name}</Td>
                  <Td className="text-xs text-gray-400">{e.last_review_date ? new Date(e.last_review_date).toLocaleDateString('pt-PT') : '–'}</Td>
                  <Td><Badge label={e.sla_met ? 'PASS' : 'FAIL'} /></Td>
                  <Td>{e.incidents_count}</Td>
                  <Td><Badge label={e.evaluation_status} /></Td>
                  <Td>{!locked && <button onClick={async () => { await t5Api.deleteSupplierEval(pid, sprint, e.id); load() }} className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button>}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      ) : <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-3 text-sm text-gray-400">P4 – Third-Party Risk não ativo (N/A)</div>}

      {p5Active ? (
        <Card>
          <CardHeader title="Acordos de Partilha de Informação" action={!locked && <Button size="sm" onClick={() => setModals(m => ({ ...m, ag: true }))}><Plus size={14} /> Adicionar</Button>} />
          {agreements.length === 0 ? <Empty message="Nenhum acordo registado." /> : (
            <Table headers={['Nome', 'IOC Partilha', 'Threat Intel', 'Report Autoridade', '']}>
              {agreements.map(a => (
                <tr key={a.id}>
                  <Td>{a.agreement_name}</Td>
                  <Td><Badge label={a.ioc_sharing_active ? 'COLLECTED' : 'MISSING'} /></Td>
                  <Td><Badge label={a.threat_intel_incorporated ? 'COLLECTED' : 'MISSING'} /></Td>
                  <Td><Badge label={a.authority_reporting_active ? 'COLLECTED' : 'MISSING'} /></Td>
                  <Td>{!locked && <button onClick={async () => { await t5Api.deleteSharingAgreement(pid, sprint, a.id); load() }} className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button>}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      ) : <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-3 text-sm text-gray-400">P5 – Information Sharing não ativo (N/A)</div>}

      {modals.inc && <IncidentModal pid={pid} sprint={sprint} existingRefs={incidents.map(i => i.incident_ref)} onClose={() => { setModals(m => ({ ...m, inc: false })); load() }} />}
      {modals.eval && <EvalModal pid={pid} sprint={sprint} onClose={() => { setModals(m => ({ ...m, eval: false })); load() }} />}
      {modals.ag && <AgreementModal pid={pid} sprint={sprint} onClose={() => { setModals(m => ({ ...m, ag: false })); load() }} />}
      {approveModal && (
        <Modal title="Fechar Sprint T5" onClose={() => setApproveModal(false)}>
          <FormField label="Aprovado por"><Input value={approver} onChange={e => setApprover(e.target.value)} /></FormField>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" onClick={() => setApproveModal(false)}>Cancelar</Button>
            <Button onClick={approve} disabled={!approver.trim()}>Confirmar</Button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function IncidentModal({ pid, sprint, existingRefs, onClose }: { pid: number; sprint: number; existingRefs: string[]; onClose: () => void }) {
  const [form, setForm] = useState({
    incident_ref: '', classification: '', detected_at: '', notified_at: '',
    notification_within_4h: false, authority_notified: false, post_mortem_completed: false, status: 'OPEN',
  })
  const dupRef = form.incident_ref.trim() !== '' && existingRefs.some(r => r.toLowerCase() === form.incident_ref.trim().toLowerCase())
  return (
    <Modal title="Novo Incidente ICT" onClose={onClose}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Ref *">
            <Input value={form.incident_ref} onChange={e => setForm(f => ({ ...f, incident_ref: e.target.value }))} placeholder="INC-001" />
            {dupRef && <p className="text-xs text-red-500 mt-1">Referência já existe neste sprint.</p>}
          </FormField>
          <FormField label="Classificação"><Input value={form.classification} onChange={e => setForm(f => ({ ...f, classification: e.target.value }))} placeholder="Ex: MAJOR, MINOR" /></FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Detetado em *"><Input type="datetime-local" value={form.detected_at} onChange={e => setForm(f => ({ ...f, detected_at: e.target.value }))} /></FormField>
          <FormField label="Notificado em"><Input type="datetime-local" value={form.notified_at} onChange={e => setForm(f => ({ ...f, notified_at: e.target.value }))} /></FormField>
        </div>
        <FormField label="Status"><Select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}><option>OPEN</option><option>RESOLVED</option><option>CLOSED</option></Select></FormField>
        <div className="grid grid-cols-3 gap-3">
          <Checkbox label="Notif. dentro 4h" checked={form.notification_within_4h} onChange={v => setForm(f => ({ ...f, notification_within_4h: v }))} />
          <Checkbox label="Autoridade notificada" checked={form.authority_notified} onChange={v => setForm(f => ({ ...f, authority_notified: v }))} />
          <Checkbox label="Post-mortem concluído" checked={form.post_mortem_completed} onChange={v => setForm(f => ({ ...f, post_mortem_completed: v }))} />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={async () => {
            await t5Api.addIncident(pid, sprint, {
              incident_ref: form.incident_ref, classification: form.classification || null,
              detected_at: form.detected_at, notified_at: form.notified_at || null,
              notification_within_4h: form.notification_within_4h,
              authority_notified: form.authority_notified ? 'true' : null,
              post_mortem_completed: form.post_mortem_completed,
              status: form.status as T5Incident['status'],
            }); onClose()
          }} disabled={!form.incident_ref || !form.detected_at || dupRef}>Guardar</Button>
        </div>
      </div>
    </Modal>
  )
}

function EvalModal({ pid, sprint, onClose }: { pid: number; sprint: number; onClose: () => void }) {
  const [form, setForm] = useState({ supplier_name: '', last_review_date: '', sla_met: true, incidents_count: 0, evaluation_status: 'COMPLIANT' })
  return (
    <Modal title="Nova Avaliação de Fornecedor" onClose={onClose}>
      <div className="space-y-3">
        <FormField label="Fornecedor *"><Input value={form.supplier_name} onChange={e => setForm(f => ({ ...f, supplier_name: e.target.value }))} /></FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Data da Última Revisão"><Input type="date" value={form.last_review_date} onChange={e => setForm(f => ({ ...f, last_review_date: e.target.value }))} /></FormField>
          <FormField label="Nº Incidentes"><Input type="number" min={0} value={form.incidents_count} onChange={e => setForm(f => ({ ...f, incidents_count: Number(e.target.value) }))} /></FormField>
        </div>
        <div className="grid grid-cols-2 gap-3 items-end">
          <FormField label="Status Avaliação">
            <Select value={form.evaluation_status} onChange={e => setForm(f => ({ ...f, evaluation_status: e.target.value }))}>
              <option>COMPLIANT</option><option>NON_COMPLIANT</option><option>AT_RISK</option><option>PENDING</option>
            </Select>
          </FormField>
          <Checkbox label="SLA cumprido" checked={form.sla_met} onChange={v => setForm(f => ({ ...f, sla_met: v }))} />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={async () => {
            await t5Api.addSupplierEval(pid, sprint, {
              supplier_name: form.supplier_name,
              last_review_date: form.last_review_date || null,
              sla_met: form.sla_met, incidents_count: form.incidents_count,
              evaluation_status: form.evaluation_status as T5SupplierEvaluation['evaluation_status'],
            }); onClose()
          }} disabled={!form.supplier_name}>Guardar</Button>
        </div>
      </div>
    </Modal>
  )
}

function AgreementModal({ pid, sprint, onClose }: { pid: number; sprint: number; onClose: () => void }) {
  const [form, setForm] = useState({ agreement_name: '', ioc_sharing_active: false, threat_intel_incorporated: false, authority_reporting_active: false })
  return (
    <Modal title="Novo Acordo de Partilha" onClose={onClose}>
      <div className="space-y-3">
        <FormField label="Nome do Acordo *"><Input value={form.agreement_name} onChange={e => setForm(f => ({ ...f, agreement_name: e.target.value }))} placeholder="Ex: ISAC MoU, Acordo Bilateral" /></FormField>
        <div className="space-y-2 pt-1">
          <Checkbox label="Partilha de IOCs ativa" checked={form.ioc_sharing_active} onChange={v => setForm(f => ({ ...f, ioc_sharing_active: v }))} />
          <Checkbox label="Threat intelligence incorporada" checked={form.threat_intel_incorporated} onChange={v => setForm(f => ({ ...f, threat_intel_incorporated: v }))} />
          <Checkbox label="Reporting a autoridade ativo" checked={form.authority_reporting_active} onChange={v => setForm(f => ({ ...f, authority_reporting_active: v }))} />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={async () => {
            await t5Api.addSharingAgreement(pid, sprint, form); onClose()
          }} disabled={!form.agreement_name}>Guardar</Button>
        </div>
      </div>
    </Modal>
  )
}


