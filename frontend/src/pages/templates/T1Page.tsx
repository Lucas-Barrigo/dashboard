import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Trash2, Plus } from 'lucide-react'
import { t1Api, projectsApi, type Project, type Template, type T1Data, type T1UserStory, type T1Risk, type T1Supplier } from '../../api'
import {
  Card, CardHeader, Button, Input, Select, Textarea, FormField,
  Checkbox, Badge, Modal, Table, Td, Spinner, Empty,
} from '../../components/ui'
import { Breadcrumbs } from '../../components/Layout'
import SprintSelector from '../../components/SprintSelector'

export default function T1Page() {
  const { projectId } = useParams<{ projectId: string }>()
  const pid = Number(projectId)
  const [templates, setTemplates] = useState<Template[]>([])
  const [project, setProject] = useState<Project | null>(null)
  const [sprint, setSprint] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const loadTemplates = async () => {
    const [ts, proj] = await Promise.all([t1Api.list(pid), projectsApi.get(pid)])
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
      <Breadcrumbs items={[{ label: 'Projetos', to: '/' }, { label: 'Projeto', to: `/projects/${pid}` }, { label: 'T1 – Risco ICT' }]} />
      <h1 className="text-2xl font-bold text-gray-900 mb-1">T1 – Gestão de Risco ICT</h1>
      <p className="text-sm text-gray-500 mb-4">User stories, registo de riscos e fornecedores por sprint</p>
      <SprintSelector templates={templates} selected={sprint} onSelect={setSprint}
        onCreate={async n => { await t1Api.create(pid, n); await loadTemplates(); setSprint(n) }} />
      {sprint && current
        ? <T1Content pid={pid} sprint={sprint} template={current} locked={current.status === 'COMPLETE'} onRefresh={loadTemplates}
            p4Active={project?.p4_active ?? true} />
        : <Empty message="Selecione ou crie um sprint." />}
    </div>
  )
}

function T1Content({ pid, sprint, template, locked, onRefresh, p4Active }: {
  pid: number; sprint: number; template: Template; locked: boolean; onRefresh: () => void; p4Active: boolean
}) {
  const [data, setData] = useState<T1Data | null>(null)
  const [stories, setStories] = useState<T1UserStory[]>([])
  const [risks, setRisks] = useState<T1Risk[]>([])
  const [suppliers, setSuppliers] = useState<T1Supplier[]>([])
  const [saving, setSaving] = useState(false)
  const [approveModal, setApproveModal] = useState(false)
  const [approver, setApprover] = useState('')
  const [storyModal, setStoryModal] = useState(false)
  const [riskModal, setRiskModal] = useState(false)
  const [supplierModal, setSupplierModal] = useState(false)

  const load = async () => {
    const [d, s, r, sup] = await Promise.allSettled([
      t1Api.getData(pid, sprint), t1Api.stories(pid, sprint),
      t1Api.risks(pid, sprint), t1Api.suppliers(pid, sprint),
    ])
    if (d.status === 'fulfilled') setData(d.value)
    else setData({ template_id: 0, incident_response_plan_status: null, dora_impact_verified: false, notes: null })
    if (s.status === 'fulfilled') setStories(s.value)
    if (r.status === 'fulfilled') setRisks(r.value)
    if (sup.status === 'fulfilled') setSuppliers(sup.value)
  }
  useEffect(() => { load() }, [pid, sprint])

  const saveData = async () => {
    if (!data) return; setSaving(true)
    await t1Api.saveData(pid, sprint, data); setSaving(false)
  }
  const initData = async () => {
    const d = await t1Api.saveData(pid, sprint, { dora_impact_verified: false })
    setData(d)
  }
  const approve = async () => {
    if (!approver.trim()) return
    await t1Api.approve(pid, sprint, approver)
    setApproveModal(false); onRefresh()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Badge label={template.status} />
        {!locked && <Button onClick={() => setApproveModal(true)}>Fechar Sprint</Button>}
        {locked && <span className="text-sm text-green-700">Aprovado por {template.approved_by}</span>}
      </div>

      {/* Scalar data */}
      <Card>
        <CardHeader title="Dados de Risco ICT" />
        <div className="p-5">
          <div className="space-y-4">
              <FormField label="Status do Plano de Resposta a Incidentes">
                <Input value={data?.incident_response_plan_status ?? ''} disabled={locked}
                  onChange={e => setData(d => d && { ...d, incident_response_plan_status: e.target.value || null })}
                  placeholder="Ex: DOCUMENTADO, EM_REVISÃO, APROVADO" />
              </FormField>
              <Checkbox label="Impacto DORA verificado para este sprint"
                checked={data?.dora_impact_verified ?? false}
                onChange={v => setData(d => d && { ...d, dora_impact_verified: v })} />
              <FormField label="Notas">
                <Textarea value={data?.notes ?? ''} disabled={locked}
                  onChange={e => setData(d => d && { ...d, notes: e.target.value })} />
              </FormField>
              {!locked && <Button variant="secondary" onClick={saveData} disabled={saving}>{saving ? 'A guardar...' : 'Guardar'}</Button>}
            </div>
        </div>
      </Card>

      {/* User Stories */}
      <Card>
        <CardHeader title="User Stories" action={!locked && <Button size="sm" onClick={() => setStoryModal(true)}><Plus size={14} /> Adicionar</Button>} />
        {stories.length === 0 ? <Empty message="Nenhuma user story adicionada." /> : (
          <Table headers={['Ref', 'Descrição', 'Risco ICT', 'Prod?', 'C.I.A', '']}>
            {stories.map(s => (
              <tr key={s.id}>
                <Td className="font-mono text-xs">{s.story_ref}</Td>
                <Td>{s.description}</Td>
                <Td><Badge label={s.introduces_ict_risk ? 'MISSING' : 'COLLECTED'} /></Td>
                <Td><Badge label={s.production_change ? 'HIGH' : 'LOW'} /></Td>
                <Td className="text-xs text-gray-500">
                  {[s.criteria_confidentiality, s.criteria_integrity, s.criteria_availability].filter(Boolean).join(' / ') || '–'}
                </Td>
                <Td>{!locked && <button onClick={async () => { await t1Api.deleteStory(pid, sprint, s.id); load() }} className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button>}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      {/* Risks */}
      <Card>
        <CardHeader title="Registo de Riscos" action={!locked && <Button size="sm" onClick={() => setRiskModal(true)}><Plus size={14} /> Adicionar</Button>} />
        {risks.length === 0 ? <Empty message="Nenhum risco registado." /> : (
          <Table headers={['Ref', 'Descrição', 'Pilar', 'Impacto', 'Prob.', 'Status', '']}>
            {risks.map(r => (
              <tr key={r.id}>
                <Td className="font-mono text-xs">{r.risk_ref}</Td>
                <Td>{r.description}</Td>
                <Td className="text-xs">{r.pillar}</Td>
                <Td><Badge label={r.impact} /></Td>
                <Td><Badge label={r.probability} /></Td>
                <Td><Badge label={r.status} /></Td>
                <Td>{!locked && <button onClick={async () => { await t1Api.deleteRisk(pid, sprint, r.id); load() }} className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button>}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      {/* Suppliers — P4 only */}
      {p4Active ? (
        <Card>
          <CardHeader title="Fornecedores" action={!locked && <Button size="sm" onClick={() => setSupplierModal(true)}><Plus size={14} /> Adicionar</Button>} />
          {suppliers.length === 0 ? <Empty message="Nenhum fornecedor registado." /> : (
            <Table headers={['Fornecedor', 'Serviço', 'Contrato', 'Acesso Crítico', '']}>
              {suppliers.map(s => (
                <tr key={s.id}>
                  <Td>{s.supplier_name}</Td>
                  <Td className="text-xs text-gray-500">{s.service_description ?? '–'}</Td>
                  <Td className="text-xs">{s.contract_status ?? '–'}</Td>
                  <Td><Badge label={s.critical_system_access ? 'HIGH' : 'LOW'} /></Td>
                  <Td>{!locked && <button onClick={async () => { await t1Api.deleteSupplier(pid, sprint, s.id); load() }} className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button>}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      ) : <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-3 text-sm text-gray-400">P4 – Third-Party Risk não ativo (N/A)</div>}

      {storyModal && <StoryModal pid={pid} sprint={sprint} existingRefs={stories.map(s => s.story_ref)} onClose={() => { setStoryModal(false); load() }} />}
      {riskModal && <RiskModal pid={pid} sprint={sprint} existingRefs={risks.map(r => r.risk_ref)} onClose={() => { setRiskModal(false); load() }} />}
      {supplierModal && <SupplierModal pid={pid} sprint={sprint} existingNames={suppliers.map(s => s.supplier_name)} onClose={() => { setSupplierModal(false); load() }} />}
      {approveModal && (
        <Modal title="Fechar Sprint T1" onClose={() => setApproveModal(false)}>
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

function StoryModal({ pid, sprint, existingRefs, onClose }: { pid: number; sprint: number; existingRefs: string[]; onClose: () => void }) {
  const [form, setForm] = useState({
    story_ref: '', description: '', affects_critical_system: false,
    introduces_ict_risk: false, production_change: false, new_third_party: false,
    criteria_confidentiality: '', criteria_integrity: '', criteria_availability: '',
  })
  const dupRef = form.story_ref.trim() !== '' && existingRefs.some(r => r.toLowerCase() === form.story_ref.trim().toLowerCase())
  return (
    <Modal title="Nova User Story" onClose={onClose}>
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <FormField label="Ref *">
            <Input value={form.story_ref} onChange={e => setForm(f => ({ ...f, story_ref: e.target.value }))} placeholder="US-001" />
            {dupRef && <p className="text-xs text-red-500 mt-1">Referência já existe neste sprint.</p>}
          </FormField>
          <div className="col-span-2"><FormField label="Descrição *"><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></FormField></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Checkbox label="Afeta sistema crítico" checked={form.affects_critical_system} onChange={v => setForm(f => ({ ...f, affects_critical_system: v }))} />
          <Checkbox label="Introduz risco ICT" checked={form.introduces_ict_risk} onChange={v => setForm(f => ({ ...f, introduces_ict_risk: v }))} />
          <Checkbox label="Mudança em produção" checked={form.production_change} onChange={v => setForm(f => ({ ...f, production_change: v }))} />
          <Checkbox label="Novo fornecedor terceiro" checked={form.new_third_party} onChange={v => setForm(f => ({ ...f, new_third_party: v }))} />
        </div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-1">Critérios CIA</p>
        <FormField label="Confidencialidade"><Input value={form.criteria_confidentiality} onChange={e => setForm(f => ({ ...f, criteria_confidentiality: e.target.value }))} /></FormField>
        <FormField label="Integridade"><Input value={form.criteria_integrity} onChange={e => setForm(f => ({ ...f, criteria_integrity: e.target.value }))} /></FormField>
        <FormField label="Disponibilidade"><Input value={form.criteria_availability} onChange={e => setForm(f => ({ ...f, criteria_availability: e.target.value }))} /></FormField>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={async () => {
            await t1Api.addStory(pid, sprint, {
              ...form,
              criteria_confidentiality: form.criteria_confidentiality || null,
              criteria_integrity: form.criteria_integrity || null,
              criteria_availability: form.criteria_availability || null,
            }); onClose()
          }} disabled={!form.story_ref || !form.description || dupRef}>Guardar</Button>
        </div>
      </div>
    </Modal>
  )
}

function RiskModal({ pid, sprint, existingRefs, onClose }: { pid: number; sprint: number; existingRefs: string[]; onClose: () => void }) {
  const [form, setForm] = useState({ risk_ref: '', description: '', probability: 'MEDIUM', impact: 'MEDIUM', pillar: 'P1', status: 'OPEN', mitigation: '' })
  const dupRef = form.risk_ref.trim() !== '' && existingRefs.some(r => r.toLowerCase() === form.risk_ref.trim().toLowerCase())
  return (
    <Modal title="Novo Risco" onClose={onClose}>
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <FormField label="Ref *">
            <Input value={form.risk_ref} onChange={e => setForm(f => ({ ...f, risk_ref: e.target.value }))} placeholder="R-001" />
            {dupRef && <p className="text-xs text-red-500 mt-1">Referência já existe neste sprint.</p>}
          </FormField>
          <div className="col-span-2"><FormField label="Pilar">
            <Select value={form.pillar} onChange={e => setForm(f => ({ ...f, pillar: e.target.value }))}>
              <option>P1</option><option>P2</option><option>P3</option><option>P4</option><option>P5</option>
            </Select>
          </FormField></div>
        </div>
        <FormField label="Descrição *"><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></FormField>
        <div className="grid grid-cols-3 gap-3">
          <FormField label="Probabilidade">
            <Select value={form.probability} onChange={e => setForm(f => ({ ...f, probability: e.target.value }))}>
              <option>LOW</option><option>MEDIUM</option><option>HIGH</option>
            </Select>
          </FormField>
          <FormField label="Impacto">
            <Select value={form.impact} onChange={e => setForm(f => ({ ...f, impact: e.target.value }))}>
              <option>LOW</option><option>MEDIUM</option><option>HIGH</option>
            </Select>
          </FormField>
          <FormField label="Status">
            <Select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option>OPEN</option><option>MITIGATED</option><option>ACCEPTED</option>
            </Select>
          </FormField>
        </div>
        <FormField label="Mitigação"><Textarea value={form.mitigation} onChange={e => setForm(f => ({ ...f, mitigation: e.target.value }))} /></FormField>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={async () => {
            await t1Api.addRisk(pid, sprint, {
              risk_ref: form.risk_ref, description: form.description,
              probability: form.probability as T1Risk['probability'],
              impact: form.impact as T1Risk['impact'],
              pillar: form.pillar, status: form.status as T1Risk['status'],
              mitigation: form.mitigation || null,
            }); onClose()
          }} disabled={!form.risk_ref || !form.description || dupRef}>Guardar</Button>
        </div>
      </div>
    </Modal>
  )
}

function SupplierModal({ pid, sprint, existingNames, onClose }: { pid: number; sprint: number; existingNames: string[]; onClose: () => void }) {
  const [form, setForm] = useState({ supplier_name: '', service_description: '', contract_status: '', critical_system_access: false })
  const dupName = form.supplier_name.trim() !== '' && existingNames.some(n => n.toLowerCase() === form.supplier_name.trim().toLowerCase())
  return (
    <Modal title="Novo Fornecedor" onClose={onClose}>
      <div className="space-y-3">
        <FormField label="Nome *">
          <Input value={form.supplier_name} onChange={e => setForm(f => ({ ...f, supplier_name: e.target.value }))} />
          {dupName && <p className="text-xs text-red-500 mt-1">Fornecedor já existe neste sprint.</p>}
        </FormField>
        <FormField label="Descrição do Serviço"><Input value={form.service_description} onChange={e => setForm(f => ({ ...f, service_description: e.target.value }))} /></FormField>
        <FormField label="Estado do Contrato"><Input value={form.contract_status} onChange={e => setForm(f => ({ ...f, contract_status: e.target.value }))} placeholder="Ex: ATIVO, PENDENTE, EXPIRADO" /></FormField>
        <Checkbox label="Acesso a sistemas críticos" checked={form.critical_system_access} onChange={v => setForm(f => ({ ...f, critical_system_access: v }))} />
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={async () => {
            await t1Api.addSupplier(pid, sprint, {
              supplier_name: form.supplier_name,
              service_description: form.service_description || null,
              contract_status: form.contract_status || null,
              critical_system_access: form.critical_system_access,
            }); onClose()
          }} disabled={!form.supplier_name || dupName}>Guardar</Button>
        </div>
      </div>
    </Modal>
  )
}
