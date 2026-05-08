import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Trash2, Plus, CheckCircle } from 'lucide-react'
import { t2Api, projectsApi, sectionNaApi, type Project, type Template, type T2Data, type T2Threat, type T2ADR, type T2SupplierSLA, type SectionExclusion } from '../../api'
import {
  Card, CardHeader, Button, Input, Select, Textarea, FormField,
  Checkbox, Badge, Modal, Table, Td, Spinner, Empty,
} from '../../components/ui'
import { Breadcrumbs } from '../../components/Layout'
import SprintSelector from '../../components/SprintSelector'
import SectionNA from '../../components/SectionNA'

export default function T2Page() {
  const { projectId } = useParams<{ projectId: string }>()
  const pid = Number(projectId)
  const [templates, setTemplates] = useState<Template[]>([])
  const [project, setProject] = useState<Project | null>(null)
  const [sprint, setSprint] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const loadTemplates = async () => {
    const [ts, proj] = await Promise.all([t2Api.list(pid), projectsApi.get(pid)])
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
      <Breadcrumbs items={[{ label: 'Projetos', to: '/' }, { label: 'Projeto', to: `/projects/${pid}` }, { label: 'T2 – Arquitetura & Ameaças' }]} />
      <h1 className="text-2xl font-bold text-gray-900 mb-1">T2 – Arquitetura Segura & Modelação de Ameaças</h1>
      <p className="text-sm text-gray-500 mb-4">Zero Trust, STRIDE, ADRs e SLAs de fornecedores por sprint</p>
      <SprintSelector templates={templates} selected={sprint} onSelect={setSprint}
        onCreate={async n => { await t2Api.create(pid, n); await loadTemplates(); setSprint(n) }} />
      {sprint && current
        ? <T2Content pid={pid} sprint={sprint} template={current} locked={current.status === 'COMPLETE'} onRefresh={loadTemplates}
            p4Active={project?.p4_active ?? true} />
        : <Empty message="Selecione ou crie um sprint." />}
    </div>
  )
}

function T2Content({ pid, sprint, template, locked, onRefresh, p4Active }: { pid: number; sprint: number; template: Template; locked: boolean; onRefresh: () => void; p4Active: boolean }) {
  const [data, setData] = useState<T2Data | null>(null)
  const [threats, setThreats] = useState<T2Threat[]>([])
  const [adrs, setAdrs] = useState<T2ADR[]>([])
  const [slas, setSlas] = useState<T2SupplierSLA[]>([])
  const [exclusions, setExclusions] = useState<SectionExclusion[]>([])
  const [saving, setSaving] = useState(false)
  const [approveModal, setApproveModal] = useState(false)
  const [approver, setApprover] = useState('')
  const [threatModal, setThreatModal] = useState(false)
  const [adrModal, setAdrModal] = useState(false)
  const [slaModal, setSlaModal] = useState(false)
  const [adrApproveId, setAdrApproveId] = useState<number | null>(null)
  const [adrApprover, setAdrApprover] = useState('')

  const load = async () => {
    const [d, t, a, s, excl] = await Promise.allSettled([
      t2Api.getData(pid, sprint), t2Api.threats(pid, sprint), t2Api.adrs(pid, sprint), t2Api.slas(pid, sprint),
      sectionNaApi.list(pid, 'T2', sprint),
    ])
    if (d.status === 'fulfilled') setData(d.value)
    else setData({ template_id: 0, zero_trust_mutual_auth: false, zero_trust_segmentation: false, zero_trust_least_privilege: false, circuit_breakers: false, failover_configured: false, drp_documented: false, redundancy_configured: false, backup_strategy_defined: false, notes: null })
    if (t.status === 'fulfilled') setThreats(t.value)
    if (a.status === 'fulfilled') setAdrs(a.value)
    if (s.status === 'fulfilled') setSlas(s.value)
    if (excl.status === 'fulfilled') setExclusions(excl.value)
  }
  useEffect(() => { load() }, [pid, sprint])

  const saveData = async () => { if (!data) return; setSaving(true); await t2Api.saveData(pid, sprint, data); setSaving(false) }
  const initData = async () => {
    const d = await t2Api.saveData(pid, sprint, {
      zero_trust_mutual_auth: false, zero_trust_segmentation: false, zero_trust_least_privilege: false,
      circuit_breakers: false, failover_configured: false, drp_documented: false,
      redundancy_configured: false, backup_strategy_defined: false,
    })
    setData(d)
  }
  const approve = async () => { if (!approver.trim()) return; await t2Api.approve(pid, sprint, approver); setApproveModal(false); onRefresh() }
  const approveAdr = async () => {
    if (!adrApproveId || !adrApprover.trim()) return
    await t2Api.approveAdr(pid, sprint, adrApproveId, adrApprover.trim(), new Date().toISOString())
    setAdrApproveId(null); setAdrApprover(''); load()
  }

  const boolField = (key: keyof T2Data, label: string) => (
    <Checkbox key={key} label={label} checked={(data?.[key] as boolean) ?? false}
      onChange={v => setData(d => d && { ...d, [key]: v })} />
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Badge label={template.status} />
        {!locked && <Button onClick={() => setApproveModal(true)}>Fechar Sprint</Button>}
        {locked && <span className="text-sm text-green-700">Aprovado por {template.approved_by}</span>}
      </div>

      <Card>
        <CardHeader title="Checklist de Arquitetura Segura" />
        <div className="p-5">
          <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Zero Trust</p>
                <div className="grid sm:grid-cols-3 gap-3">
                  {boolField('zero_trust_mutual_auth', 'Autenticação mútua')}
                  {boolField('zero_trust_segmentation', 'Segmentação de rede')}
                  {boolField('zero_trust_least_privilege', 'Mínimo privilégio')}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Resiliência</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {boolField('circuit_breakers', 'Circuit Breakers configurados')}
                  {boolField('failover_configured', 'Failover configurado')}
                  {boolField('drp_documented', 'DRP documentado')}
                  {boolField('redundancy_configured', 'Redundância configurada')}
                  {boolField('backup_strategy_defined', 'Estratégia de backup definida')}
                </div>
              </div>
              <FormField label="Notas"><Textarea value={data?.notes ?? ''} disabled={locked} onChange={e => setData(d => d && { ...d, notes: e.target.value })} /></FormField>
              {!locked && <Button variant="secondary" onClick={saveData} disabled={saving}>{saving ? 'A guardar...' : 'Guardar'}</Button>}
            </div>
        </div>
      </Card>

      <SectionNA pid={pid} templateType="T2" sprint={sprint} sectionKey="threat_model"
        title="Threat Model STRIDE" action={!locked && <Button size="sm" onClick={() => setThreatModal(true)}><Plus size={14} /> Adicionar</Button>}
        exclusion={exclusions.find(e => e.section_key === 'threat_model') ?? null} onChanged={load}>
        {threats.length === 0 ? <Empty message="Nenhuma ameaça registada." /> : (
          <Table headers={['Ref', 'STRIDE', 'Descrição', 'Ativo Afetado', 'Risco', 'Mitigação', '']}>
            {threats.map(t => (
              <tr key={t.id}>
                <Td className="font-mono text-xs">{t.threat_ref}</Td>
                <Td className="text-xs">{t.stride_category}</Td>
                <Td>{t.description}</Td>
                <Td className="text-xs text-gray-500">{t.affected_asset ?? '–'}</Td>
                <Td><Badge label={t.risk_level} /></Td>
                <Td className="text-xs text-gray-500 max-w-[200px] truncate">{t.mitigation ?? '–'}</Td>
                <Td>{!locked && <button onClick={async () => { await t2Api.deleteThreat(pid, sprint, t.id); load() }} className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button>}</Td>
              </tr>
            ))}
          </Table>
        )}
      </SectionNA>

      <SectionNA pid={pid} templateType="T2" sprint={sprint} sectionKey="adrs"
        title="ADRs – Architectural Decision Records" action={!locked && <Button size="sm" onClick={() => setAdrModal(true)}><Plus size={14} /> Adicionar</Button>}
        exclusion={exclusions.find(e => e.section_key === 'adrs') ?? null} onChanged={load}>
        {adrs.length === 0 ? <Empty message="Nenhum ADR registado." /> : (
          <Table headers={['Ref', 'Decisão', 'Risco DORA', 'Risk Mgr', 'Data', '']}>
            {adrs.map(a => (
              <tr key={a.id}>
                <Td className="font-mono text-xs">{a.adr_ref}</Td>
                <Td>{a.decision}</Td>
                <Td className="text-xs text-gray-500 max-w-[150px] truncate">{a.dora_implications ?? '–'}</Td>
                <Td>{a.risk_mgr_approved ? <Badge label="COLLECTED" /> : <Badge label="MISSING" />}</Td>
                <Td className="text-xs text-gray-400">{a.approved_at ? new Date(a.approved_at).toLocaleDateString('pt-PT') : '–'}</Td>
                <Td className="flex gap-2">
                  {!locked && !a.risk_mgr_approved && (
                    <button onClick={() => { setAdrApproveId(a.id); setAdrApprover('') }} className="text-green-600 hover:text-green-800 cursor-pointer" title="Aprovar ADR"><CheckCircle size={14} /></button>
                  )}
                  {!locked && <button onClick={async () => { await t2Api.deleteAdr(pid, sprint, a.id); load() }} className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button>}
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </SectionNA>

      {p4Active ? (
        <SectionNA pid={pid} templateType="T2" sprint={sprint} sectionKey="supplier_slas"
          title="SLAs de Fornecedores" action={!locked && <Button size="sm" onClick={() => setSlaModal(true)}><Plus size={14} /> Adicionar</Button>}
          exclusion={exclusions.find(e => e.section_key === 'supplier_slas') ?? null} onChanged={load}>
          {slas.length === 0 ? <Empty message="Nenhum SLA registado." /> : (
            <Table headers={['Fornecedor', 'SLA Disp.', 'Cláusula Notif.', 'Auditoria', 'Status', '']}>
              {slas.map(s => (
                <tr key={s.id}>
                  <Td>{s.supplier_name}</Td>
                  <Td className="text-xs">{s.availability_sla ?? '–'}</Td>
                  <Td><Badge label={s.incident_notification_clause ? 'COLLECTED' : 'MISSING'} /></Td>
                  <Td><Badge label={s.audit_rights ? 'COLLECTED' : 'MISSING'} /></Td>
                  <Td><Badge label={s.sla_status ?? 'NA'} /></Td>
                  <Td>{!locked && <button onClick={async () => { await t2Api.deleteSla(pid, sprint, s.id); load() }} className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button>}</Td>
                </tr>
              ))}
            </Table>
          )}
        </SectionNA>
      ) : <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-3 text-sm text-gray-400">P4 – Third-Party Risk não ativo (N/A)</div>}

      {threatModal && <ThreatModal pid={pid} sprint={sprint} existingRefs={threats.map(t => t.threat_ref)} onClose={() => { setThreatModal(false); load() }} />}
      {adrModal && <AdrModal pid={pid} sprint={sprint} existingRefs={adrs.map(a => a.adr_ref)} onClose={() => { setAdrModal(false); load() }} />}
      {slaModal && <SlaModal pid={pid} sprint={sprint} existingNames={slas.map(s => s.supplier_name)} onClose={() => { setSlaModal(false); load() }} />}
      {adrApproveId !== null && (
        <Modal title="Aprovar ADR – Risk Manager" onClose={() => setAdrApproveId(null)}>
          <p className="text-sm text-gray-600 mb-4">Confirmar aprovação do ADR pelo Risk Manager.</p>
          <FormField label="Nome do Risk Manager *">
            <Input value={adrApprover} onChange={e => setAdrApprover(e.target.value)} placeholder="Ex: João Costa" autoFocus />
          </FormField>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" onClick={() => setAdrApproveId(null)}>Cancelar</Button>
            <Button onClick={approveAdr} disabled={!adrApprover.trim()}>Confirmar Aprovação</Button>
          </div>
        </Modal>
      )}
      {approveModal && (
        <Modal title="Fechar Sprint T2" onClose={() => setApproveModal(false)}>
          <p className="text-sm text-gray-500 mb-3">Todos os ADRs devem estar aprovados pelo Risk Manager.</p>
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

function ThreatModal({ pid, sprint, existingRefs, onClose }: { pid: number; sprint: number; existingRefs: string[]; onClose: () => void }) {
  const STRIDE = ['Spoofing', 'Tampering', 'Repudiation', 'Information Disclosure', 'Denial of Service', 'Elevation of Privilege']
  const [form, setForm] = useState({ threat_ref: '', stride_category: STRIDE[0], description: '', affected_asset: '', risk_level: 'MEDIUM', mitigation: '' })
  const dupRef = form.threat_ref.trim() !== '' && existingRefs.some(r => r.toLowerCase() === form.threat_ref.trim().toLowerCase())
  return (
    <Modal title="Nova Ameaça STRIDE" onClose={onClose}>
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <FormField label="Ref *">
            <Input value={form.threat_ref} onChange={e => setForm(f => ({ ...f, threat_ref: e.target.value }))} placeholder="T-001" />
            {dupRef && <p className="text-xs text-red-500 mt-1">Referência já existe neste sprint.</p>}
          </FormField>
          <div className="col-span-2"><FormField label="Categoria STRIDE"><Select value={form.stride_category} onChange={e => setForm(f => ({ ...f, stride_category: e.target.value }))}>{STRIDE.map(s => <option key={s}>{s}</option>)}</Select></FormField></div>
        </div>
        <FormField label="Descrição *"><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Ativo Afetado"><Input value={form.affected_asset} onChange={e => setForm(f => ({ ...f, affected_asset: e.target.value }))} /></FormField>
          <FormField label="Nível de Risco"><Select value={form.risk_level} onChange={e => setForm(f => ({ ...f, risk_level: e.target.value }))}><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option></Select></FormField>
        </div>
        <FormField label="Mitigação"><Textarea value={form.mitigation} onChange={e => setForm(f => ({ ...f, mitigation: e.target.value }))} /></FormField>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={async () => {
            await t2Api.addThreat(pid, sprint, {
              threat_ref: form.threat_ref, stride_category: form.stride_category,
              description: form.description, affected_asset: form.affected_asset || null,
              risk_level: form.risk_level as T2Threat['risk_level'],
              mitigation: form.mitigation || null,
            }); onClose()
          }} disabled={!form.threat_ref || !form.description || dupRef}>Guardar</Button>
        </div>
      </div>
    </Modal>
  )
}

function AdrModal({ pid, sprint, existingRefs, onClose }: { pid: number; sprint: number; existingRefs: string[]; onClose: () => void }) {
  const [form, setForm] = useState({ adr_ref: '', decision: '', context: '', alternatives: '', security_justification: '', dora_implications: '' })
  const dupRef = form.adr_ref.trim() !== '' && existingRefs.some(r => r.toLowerCase() === form.adr_ref.trim().toLowerCase())
  return (
    <Modal title="Novo ADR" onClose={onClose}>
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <FormField label="Ref *">
            <Input value={form.adr_ref} onChange={e => setForm(f => ({ ...f, adr_ref: e.target.value }))} placeholder="ADR-001" />
            {dupRef && <p className="text-xs text-red-500 mt-1">Referência já existe neste sprint.</p>}
          </FormField>
          <div className="col-span-2"><FormField label="Decisão *"><Input value={form.decision} onChange={e => setForm(f => ({ ...f, decision: e.target.value }))} /></FormField></div>
        </div>
        <FormField label="Contexto"><Textarea value={form.context} onChange={e => setForm(f => ({ ...f, context: e.target.value }))} /></FormField>
        <FormField label="Alternativas Consideradas"><Textarea value={form.alternatives} onChange={e => setForm(f => ({ ...f, alternatives: e.target.value }))} /></FormField>
        <FormField label="Justificação de Segurança"><Textarea value={form.security_justification} onChange={e => setForm(f => ({ ...f, security_justification: e.target.value }))} /></FormField>
        <FormField label="Implicações DORA"><Textarea value={form.dora_implications} onChange={e => setForm(f => ({ ...f, dora_implications: e.target.value }))} /></FormField>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={async () => {
            await t2Api.addAdr(pid, sprint, {
              adr_ref: form.adr_ref, decision: form.decision,
              context: form.context || null, alternatives: form.alternatives || null,
              security_justification: form.security_justification || null,
              dora_implications: form.dora_implications || null,
            }); onClose()
          }} disabled={!form.adr_ref || !form.decision || dupRef}>Guardar</Button>
        </div>
      </div>
    </Modal>
  )
}

function SlaModal({ pid, sprint, existingNames, onClose }: { pid: number; sprint: number; existingNames: string[]; onClose: () => void }) {
  const [form, setForm] = useState({ supplier_name: '', availability_sla: '', incident_notification_clause: false, audit_rights: false, sla_status: 'MET' })
  const dupName = form.supplier_name.trim() !== '' && existingNames.some(n => n.toLowerCase() === form.supplier_name.trim().toLowerCase())
  return (
    <Modal title="Novo SLA de Fornecedor" onClose={onClose}>
      <div className="space-y-3">
        <FormField label="Fornecedor *">
          <Input value={form.supplier_name} onChange={e => setForm(f => ({ ...f, supplier_name: e.target.value }))} />
          {dupName && <p className="text-xs text-red-500 mt-1">Fornecedor já existe neste sprint.</p>}
        </FormField>
        <FormField label="SLA de Disponibilidade"><Input value={form.availability_sla} onChange={e => setForm(f => ({ ...f, availability_sla: e.target.value }))} placeholder="Ex: 99.9% por mês" /></FormField>
        <FormField label="Status SLA"><Select value={form.sla_status} onChange={e => setForm(f => ({ ...f, sla_status: e.target.value }))}><option>MET</option><option>BREACHED</option><option>AT_RISK</option></Select></FormField>
        <div className="grid grid-cols-2 gap-3">
          <Checkbox label="Cláusula de notificação de incidentes" checked={form.incident_notification_clause} onChange={v => setForm(f => ({ ...f, incident_notification_clause: v }))} />
          <Checkbox label="Direitos de Auditoria" checked={form.audit_rights} onChange={v => setForm(f => ({ ...f, audit_rights: v }))} />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={async () => {
            await t2Api.addSla(pid, sprint, {
              supplier_name: form.supplier_name,
              availability_sla: form.availability_sla || null,
              incident_notification_clause: form.incident_notification_clause,
              audit_rights: form.audit_rights,
              sla_status: form.sla_status as T2SupplierSLA['sla_status'],
            }); onClose()
          }} disabled={!form.supplier_name || dupName}>Guardar</Button>
        </div>
      </div>
    </Modal>
  )
}

