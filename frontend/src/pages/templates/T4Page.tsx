import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Trash2, Plus } from 'lucide-react'
import { t4Api, t2Api, projectsApi, sectionNaApi, type Project, type Template, type T2Threat, type T4Data, type T4SecurityTest, type T4PenTest, type T4ResilienceTest, type T4SupplierFailureSim, type T4CrossSectorExercise, type SectionExclusion } from '../../api'
import {
  Card, CardHeader, Button, Input, Select, Textarea, FormField,
  Checkbox, Badge, Modal, Table, Td, Spinner, Empty,
} from '../../components/ui'
import { Breadcrumbs } from '../../components/Layout'
import SprintSelector from '../../components/SprintSelector'
import SectionNA from '../../components/SectionNA'

export default function T4Page() {
  const { projectId } = useParams<{ projectId: string }>()
  const pid = Number(projectId)
  const [templates, setTemplates] = useState<Template[]>([])
  const [project, setProject] = useState<Project | null>(null)
  const [sprint, setSprint] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const loadTemplates = async () => {
    const [ts, proj] = await Promise.all([t4Api.list(pid), projectsApi.get(pid)])
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
      <Breadcrumbs items={[{ label: 'Projetos', to: '/' }, { label: 'Projeto', to: `/projects/${pid}` }, { label: 'T4 – Testes de Resiliência' }]} />
      <h1 className="text-2xl font-bold text-gray-900 mb-1">T4 – Testes de Resiliência Digital</h1>
      <p className="text-sm text-gray-500 mb-4">TLPT, pen tests, testes funcionais de segurança e simulações por sprint</p>
      <SprintSelector templates={templates} selected={sprint} onSelect={setSprint}
        onCreate={async n => { await t4Api.create(pid, n); await loadTemplates(); setSprint(n) }} />
      {sprint && current
        ? <T4Content pid={pid} sprint={sprint} template={current} locked={current.status === 'COMPLETE'} onRefresh={loadTemplates}
            p4Active={project?.p4_active ?? true} />
        : <Empty message="Selecione ou crie um sprint." />}
    </div>
  )
}

function T4Content({ pid, sprint, template, locked, onRefresh, p4Active }: { pid: number; sprint: number; template: Template; locked: boolean; onRefresh: () => void; p4Active: boolean }) {
  const [data, setData] = useState<T4Data | null>(null)
  const [secTests, setSecTests] = useState<T4SecurityTest[]>([])
  const [penTests, setPenTests] = useState<T4PenTest[]>([])
  const [resTests, setResTests] = useState<T4ResilienceTest[]>([])
  const [sims, setSims] = useState<T4SupplierFailureSim[]>([])
  const [exercises, setExercises] = useState<T4CrossSectorExercise[]>([])
  const [exclusions, setExclusions] = useState<SectionExclusion[]>([])
  const [saving, setSaving] = useState(false)
  const [approveModal, setApproveModal] = useState(false)
  const [approver, setApprover] = useState('')
  const [modals, setModals] = useState({ sec: false, pen: false, res: false, sim: false, ex: false })

  const load = async () => {
    const [d, st, pt, rt, sm, ex, excl] = await Promise.allSettled([
      t4Api.getData(pid, sprint), t4Api.securityTests(pid, sprint),
      t4Api.penTests(pid, sprint), t4Api.resilienceTests(pid, sprint), t4Api.supplierSims(pid, sprint),
      t4Api.crossSectorExercises(pid, sprint), sectionNaApi.list(pid, 'T4', sprint),
    ])
    if (d.status === 'fulfilled') setData(d.value)
    else setData({ template_id: 0, tlpt_applicable: false, tlpt_completed_or_scheduled: false, tlpt_date: null, tlpt_tester_certified: false, tlpt_tester_insured: false, audit_trail_integrity_verified: false, incident_response_tested: false, risk_assessments_validated: false, notes: null })
    if (st.status === 'fulfilled') setSecTests(st.value)
    if (pt.status === 'fulfilled') setPenTests(pt.value)
    if (rt.status === 'fulfilled') setResTests(rt.value)
    if (sm.status === 'fulfilled') setSims(sm.value)
    if (ex.status === 'fulfilled') setExercises(ex.value)
    if (excl.status === 'fulfilled') setExclusions(excl.value)
  }
  useEffect(() => { load() }, [pid, sprint])

  const saveData = async () => { if (!data) return; setSaving(true); await t4Api.saveData(pid, sprint, data); setSaving(false) }
  const initData = async () => {
    const d = await t4Api.saveData(pid, sprint, {
      tlpt_applicable: false, tlpt_completed_or_scheduled: false,
      tlpt_tester_certified: false, tlpt_tester_insured: false,
      audit_trail_integrity_verified: false, incident_response_tested: false, risk_assessments_validated: false,
    })
    setData(d)
  }
  const approve = async () => { if (!approver.trim()) return; await t4Api.approve(pid, sprint, approver); setApproveModal(false); onRefresh() }

  const boolField = (key: keyof T4Data, label: string) => (
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
        <CardHeader title="TLPT & Validações de Resiliência" />
        <div className="p-5">
          <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                {boolField('tlpt_applicable', 'TLPT aplicável a esta entidade')}
                {boolField('tlpt_completed_or_scheduled', 'TLPT concluído ou agendado')}
                {boolField('audit_trail_integrity_verified', 'Integridade do audit trail verificada')}
                {boolField('incident_response_tested', 'Resposta a incidentes testada')}
                {boolField('risk_assessments_validated', 'Avaliações de risco validadas')}
              </div>
              {data?.tlpt_completed_or_scheduled && (
                <>
                  <FormField label="Data TLPT">
                    <Input type="date" value={data?.tlpt_date ?? ''} disabled={locked}
                      onChange={e => setData(d => d && { ...d, tlpt_date: e.target.value || null })} />
                  </FormField>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Qualificação do Testador – Art. 27</p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {boolField('tlpt_tester_certified', 'Testador TLPT certificado (Art. 27 DORA)')}
                      {boolField('tlpt_tester_insured',   'Testador TLPT com seguro profissional (Art. 27 DORA)')}
                    </div>
                  </div>
                </>
              )}
              <FormField label="Notas"><Textarea value={data?.notes ?? ''} disabled={locked} onChange={e => setData(d => d && { ...d, notes: e.target.value })} /></FormField>
              {!locked && <Button variant="secondary" onClick={saveData} disabled={saving}>{saving ? 'A guardar...' : 'Guardar'}</Button>}
            </div>
        </div>
      </Card>

      <SectionNA pid={pid} templateType="T4" sprint={sprint} sectionKey="security_testing"
        title="Testes Funcionais de Segurança" action={!locked && <Button size="sm" onClick={() => setModals(m => ({ ...m, sec: true }))}><Plus size={14} /> Adicionar</Button>}
        exclusion={exclusions.find(e => e.section_key === 'security_testing') ?? null} onChanged={load}>
        {secTests.length === 0 ? <Empty message="Nenhum teste registado." /> : (
          <Table headers={['Ref', 'Ameaça', 'Descrição', 'Resultado', 'Evidência', '']}>
            {secTests.map(s => (
              <tr key={s.id}>
                <Td className="font-mono text-xs">{s.test_ref}</Td>
                <Td className="font-mono text-xs text-gray-500">{s.threat_ref ?? '–'}</Td>
                <Td>{s.description}</Td>
                <Td><Badge label={s.result} /></Td>
                <Td className="text-xs text-gray-500">{s.evidence_ref ?? '–'}</Td>
                <Td>{!locked && <button onClick={async () => { await t4Api.deleteSecurityTest(pid, sprint, s.id); load() }} className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button>}</Td>
              </tr>
            ))}
          </Table>
        )}
      </SectionNA>

      <SectionNA pid={pid} templateType="T4" sprint={sprint} sectionKey="pen_testing"
        title="Pen Tests" action={!locked && <Button size="sm" onClick={() => setModals(m => ({ ...m, pen: true }))}><Plus size={14} /> Adicionar</Button>}
        exclusion={exclusions.find(e => e.section_key === 'pen_testing') ?? null} onChanged={load}>
        {penTests.length === 0 ? <Empty message="Nenhum pen test registado." /> : (
          <Table headers={['Data', 'Entidade', 'Âmbito', 'Críticos Enc.', 'Críticos Rem.', 'Status', '']}>
            {penTests.map(p => (
              <tr key={p.id}>
                <Td className="text-xs text-gray-400">{p.test_date ? new Date(p.test_date).toLocaleDateString('pt-PT') : '–'}</Td>
                <Td className="text-xs">{p.responsible_entity ?? '–'}</Td>
                <Td>{p.scope ?? '–'}</Td>
                <Td className={p.critical_vulns_found > 0 ? 'text-red-600 font-semibold' : ''}>{p.critical_vulns_found}</Td>
                <Td>{p.critical_vulns_remediated}</Td>
                <Td><Badge label={p.status ?? 'PLANNED'} /></Td>
                <Td>{!locked && <button onClick={async () => { await t4Api.deletePenTest(pid, sprint, p.id); load() }} className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button>}</Td>
              </tr>
            ))}
          </Table>
        )}
      </SectionNA>

      <SectionNA pid={pid} templateType="T4" sprint={sprint} sectionKey="resilience_testing"
        title="Testes de Resiliência" action={!locked && <Button size="sm" onClick={() => setModals(m => ({ ...m, res: true }))}><Plus size={14} /> Adicionar</Button>}
        exclusion={exclusions.find(e => e.section_key === 'resilience_testing') ?? null} onChanged={load}>
        {resTests.length === 0 ? <Empty message="Nenhum teste de resiliência registado." /> : (
          <Table headers={['Tipo', 'Data', 'RTO Alvo (h)', 'RTO Atingido (h)', 'Resultado', '']}>
            {resTests.map(r => (
              <tr key={r.id}>
                <Td>{r.test_type}</Td>
                <Td className="text-xs text-gray-400">{r.test_date ? new Date(r.test_date).toLocaleDateString('pt-PT') : '–'}</Td>
                <Td>{r.rto_target ?? '–'}</Td>
                <Td>{r.rto_achieved ?? '–'}</Td>
                <Td><Badge label={r.result} /></Td>
                <Td>{!locked && <button onClick={async () => { await t4Api.deleteResilienceTest(pid, sprint, r.id); load() }} className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button>}</Td>
              </tr>
            ))}
          </Table>
        )}
      </SectionNA>

      {p4Active ? (
        <SectionNA pid={pid} templateType="T4" sprint={sprint} sectionKey="supplier_testing"
          title="Simulações de Falha de Fornecedor" action={!locked && <Button size="sm" onClick={() => setModals(m => ({ ...m, sim: true }))}><Plus size={14} /> Adicionar</Button>}
          exclusion={exclusions.find(e => e.section_key === 'supplier_testing') ?? null} onChanged={load}>
          {sims.length === 0 ? <Empty message="Nenhuma simulação registada." /> : (
            <Table headers={['Fornecedor', 'Cenário', 'Contingência Ativada', 'Resultado', '']}>
              {sims.map(s => (
                <tr key={s.id}>
                  <Td>{s.supplier_name}</Td>
                  <Td className="text-xs text-gray-500">{s.scenario_description ?? '–'}</Td>
                  <Td><Badge label={s.contingency_activated ? 'COLLECTED' : 'MISSING'} /></Td>
                  <Td><Badge label={s.result} /></Td>
                  <Td>{!locked && <button onClick={async () => { await t4Api.deleteSupplierSim(pid, sprint, s.id); load() }} className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button>}</Td>
                </tr>
              ))}
            </Table>
          )}
        </SectionNA>
      ) : <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-3 text-sm text-gray-400">P4 – Third-Party Risk não ativo (N/A)</div>}

      <SectionNA pid={pid} templateType="T4" sprint={sprint} sectionKey="cross_sector"
        title="Exercícios Cross-Sector – Art. 49" action={!locked && <Button size="sm" onClick={() => setModals(m => ({ ...m, ex: true }))}><Plus size={14} /> Adicionar</Button>}
        exclusion={exclusions.find(e => e.section_key === 'cross_sector') ?? null} onChanged={load}>
        {exercises.length === 0 ? <Empty message="Nenhum exercício cross-sector registado." /> : (
          <Table headers={['Exercício', 'Data', 'Organizado por', 'Participação', 'Cenário', 'Resultado', '']}>
            {exercises.map(e => (
              <tr key={e.id}>
                <Td>{e.exercise_name}</Td>
                <Td className="text-xs text-gray-400">{e.exercise_date ? new Date(e.exercise_date).toLocaleDateString('pt-PT') : '–'}</Td>
                <Td className="text-xs text-gray-500">{e.organized_by ?? '–'}</Td>
                <Td><Badge label={e.participation_type} /></Td>
                <Td className="text-xs text-gray-500">{e.scenario_type ?? '–'}</Td>
                <Td className="text-xs text-gray-500 max-w-[120px] truncate">{e.outcome ?? '–'}</Td>
                <Td>{!locked && <button onClick={async () => { await t4Api.deleteCrossSectorExercise(pid, sprint, e.id); load() }} className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button>}</Td>
              </tr>
            ))}
          </Table>
        )}
      </SectionNA>

      {modals.sec && <SecTestModal pid={pid} sprint={sprint} existingRefs={secTests.map(s => s.test_ref)} onClose={() => { setModals(m => ({ ...m, sec: false })); load() }} />}
      {modals.pen && <PenTestModal pid={pid} sprint={sprint} onClose={() => { setModals(m => ({ ...m, pen: false })); load() }} />}
      {modals.res && <ResTestModal pid={pid} sprint={sprint} onClose={() => { setModals(m => ({ ...m, res: false })); load() }} />}
      {modals.sim && <SimModal pid={pid} sprint={sprint} onClose={() => { setModals(m => ({ ...m, sim: false })); load() }} />}
      {modals.ex && <ExerciseModal pid={pid} sprint={sprint} onClose={() => { setModals(m => ({ ...m, ex: false })); load() }} />}
      {approveModal && (
        <Modal title="Fechar Sprint T4" onClose={() => setApproveModal(false)}>
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

function SecTestModal({ pid, sprint, existingRefs, onClose }: { pid: number; sprint: number; existingRefs: string[]; onClose: () => void }) {
  const [form, setForm] = useState({ test_ref: '', threat_ref: '', description: '', result: 'PASS', evidence_ref: '' })
  const [threats, setThreats] = useState<T2Threat[]>([])
  useEffect(() => { t2Api.threats(pid, sprint).then(setThreats).catch(() => {}) }, [])
  const dupRef = form.test_ref.trim() !== '' && existingRefs.some(r => r.toLowerCase() === form.test_ref.trim().toLowerCase())
  return (
    <Modal title="Novo Teste de Segurança" onClose={onClose}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Ref Teste *">
            <Input value={form.test_ref} onChange={e => setForm(f => ({ ...f, test_ref: e.target.value }))} placeholder="ST-001" />
            {dupRef && <p className="text-xs text-red-500 mt-1">Referência já existe neste sprint.</p>}
          </FormField>
          <FormField label="Ameaça T2 associada">
            {threats.length > 0 ? (
              <Select value={form.threat_ref} onChange={e => setForm(f => ({ ...f, threat_ref: e.target.value }))}>
                <option value="">— Nenhuma —</option>
                {threats.map(t => (
                  <option key={t.id} value={t.threat_ref}>{t.threat_ref} – {t.description}</option>
                ))}
              </Select>
            ) : (
              <Input value={form.threat_ref} onChange={e => setForm(f => ({ ...f, threat_ref: e.target.value }))} placeholder="Sem ameaças T2 neste sprint" />
            )}
          </FormField>
        </div>
        <FormField label="Descrição"><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Resultado *"><Select value={form.result} onChange={e => setForm(f => ({ ...f, result: e.target.value }))}><option>PASS</option><option>FAIL</option><option>PARTIAL</option></Select></FormField>
          <FormField label="Ref. Evidência"><Input value={form.evidence_ref} onChange={e => setForm(f => ({ ...f, evidence_ref: e.target.value }))} /></FormField>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={async () => {
            await t4Api.addSecurityTest(pid, sprint, {
              test_ref: form.test_ref, threat_ref: form.threat_ref || null,
              description: form.description, result: form.result as T4SecurityTest['result'],
              evidence_ref: form.evidence_ref || null,
            }); onClose()
          }} disabled={!form.test_ref || dupRef}>Guardar</Button>
        </div>
      </div>
    </Modal>
  )
}

function PenTestModal({ pid, sprint, onClose }: { pid: number; sprint: number; onClose: () => void }) {
  const [form, setForm] = useState({ test_date: '', responsible_entity: '', scope: '', critical_vulns_found: 0, critical_vulns_remediated: 0, formal_report_ref: '', status: 'PLANNED' })
  return (
    <Modal title="Novo Pen Test" onClose={onClose}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Data"><Input type="date" value={form.test_date} onChange={e => setForm(f => ({ ...f, test_date: e.target.value }))} /></FormField>
          <FormField label="Entidade Responsável"><Input value={form.responsible_entity} onChange={e => setForm(f => ({ ...f, responsible_entity: e.target.value }))} /></FormField>
        </div>
        <FormField label="Âmbito"><Input value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value }))} /></FormField>
        <div className="grid grid-cols-3 gap-3">
          <FormField label="Críticos Encontrados"><Input type="number" min={0} value={form.critical_vulns_found} onChange={e => setForm(f => ({ ...f, critical_vulns_found: Number(e.target.value) }))} /></FormField>
          <FormField label="Críticos Remediados"><Input type="number" min={0} value={form.critical_vulns_remediated} onChange={e => setForm(f => ({ ...f, critical_vulns_remediated: Number(e.target.value) }))} /></FormField>
          <FormField label="Status"><Select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}><option>PLANNED</option><option>IN_PROGRESS</option><option>COMPLETE</option><option>CANCELLED</option></Select></FormField>
        </div>
        <FormField label="Ref. Relatório Formal"><Input value={form.formal_report_ref} onChange={e => setForm(f => ({ ...f, formal_report_ref: e.target.value }))} /></FormField>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={async () => {
            await t4Api.addPenTest(pid, sprint, {
              test_date: form.test_date || null, responsible_entity: form.responsible_entity || null,
              scope: form.scope || null, critical_vulns_found: form.critical_vulns_found,
              critical_vulns_remediated: form.critical_vulns_remediated,
              formal_report_ref: form.formal_report_ref || null,
              status: form.status as T4PenTest['status'],
            }); onClose()
          }}>Guardar</Button>
        </div>
      </div>
    </Modal>
  )
}

function ResTestModal({ pid, sprint, onClose }: { pid: number; sprint: number; onClose: () => void }) {
  const [form, setForm] = useState({ test_type: '', test_date: '', rto_target: '', rto_achieved: '', result: 'PASS', notes: '' })
  return (
    <Modal title="Novo Teste de Resiliência" onClose={onClose}>
      <div className="space-y-3">
        <FormField label="Tipo de Teste *"><Input value={form.test_type} onChange={e => setForm(f => ({ ...f, test_type: e.target.value }))} placeholder="Ex: Failover, DR, BCP" /></FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Data"><Input type="date" value={form.test_date} onChange={e => setForm(f => ({ ...f, test_date: e.target.value }))} /></FormField>
          <FormField label="Resultado *"><Select value={form.result} onChange={e => setForm(f => ({ ...f, result: e.target.value }))}><option>PASS</option><option>FAIL</option><option>PARTIAL</option></Select></FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="RTO Alvo (h)"><Input type="number" step="0.5" value={form.rto_target} onChange={e => setForm(f => ({ ...f, rto_target: e.target.value }))} /></FormField>
          <FormField label="RTO Atingido (h)"><Input type="number" step="0.5" value={form.rto_achieved} onChange={e => setForm(f => ({ ...f, rto_achieved: e.target.value }))} /></FormField>
        </div>
        <FormField label="Notas"><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></FormField>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={async () => {
            await t4Api.addResilienceTest(pid, sprint, {
              test_type: form.test_type, test_date: form.test_date || null,
              rto_target: form.rto_target || null,
              rto_achieved: form.rto_achieved || null,
              result: form.result as T4ResilienceTest['result'], notes: form.notes || null,
            }); onClose()
          }} disabled={!form.test_type}>Guardar</Button>
        </div>
      </div>
    </Modal>
  )
}

function SimModal({ pid, sprint, onClose }: { pid: number; sprint: number; onClose: () => void }) {
  const [form, setForm] = useState({ supplier_name: '', scenario_description: '', contingency_activated: false, result: 'PASS' })
  return (
    <Modal title="Nova Simulação de Falha" onClose={onClose}>
      <div className="space-y-3">
        <FormField label="Fornecedor *"><Input value={form.supplier_name} onChange={e => setForm(f => ({ ...f, supplier_name: e.target.value }))} /></FormField>
        <FormField label="Descrição do Cenário"><Textarea value={form.scenario_description} onChange={e => setForm(f => ({ ...f, scenario_description: e.target.value }))} /></FormField>
        <div className="grid grid-cols-2 gap-3 items-end">
          <FormField label="Resultado"><Select value={form.result} onChange={e => setForm(f => ({ ...f, result: e.target.value }))}><option>PASS</option><option>FAIL</option><option>PARTIAL</option></Select></FormField>
          <Checkbox label="Contingência ativada" checked={form.contingency_activated} onChange={v => setForm(f => ({ ...f, contingency_activated: v }))} />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={async () => {
            await t4Api.addSupplierSim(pid, sprint, {
              supplier_name: form.supplier_name,
              scenario_description: form.scenario_description || null,
              contingency_activated: form.contingency_activated,
              result: form.result as T4SupplierFailureSim['result'],
            }); onClose()
          }} disabled={!form.supplier_name}>Guardar</Button>
        </div>
      </div>
    </Modal>
  )
}

function ExerciseModal({ pid, sprint, onClose }: { pid: number; sprint: number; onClose: () => void }) {
  const [form, setForm] = useState({ exercise_name: '', exercise_date: '', organized_by: '', participation_type: 'PARTICIPANT', scenario_type: '', outcome: '' })
  return (
    <Modal title="Novo Exercício Cross-Sector (Art. 49)" onClose={onClose}>
      <div className="space-y-3">
        <FormField label="Nome do Exercício *"><Input value={form.exercise_name} onChange={e => setForm(f => ({ ...f, exercise_name: e.target.value }))} placeholder="Ex: ENISA CyberEurope 2025" /></FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Data"><Input type="date" value={form.exercise_date} onChange={e => setForm(f => ({ ...f, exercise_date: e.target.value }))} /></FormField>
          <FormField label="Tipo de Participação">
            <Select value={form.participation_type} onChange={e => setForm(f => ({ ...f, participation_type: e.target.value }))}>
              <option value="PARTICIPANT">Participante</option>
              <option value="OBSERVER">Observador</option>
              <option value="ORGANIZER">Organizador</option>
            </Select>
          </FormField>
        </div>
        <FormField label="Organizado por"><Input value={form.organized_by} onChange={e => setForm(f => ({ ...f, organized_by: e.target.value }))} placeholder="Ex: ENISA, Banco de Portugal" /></FormField>
        <FormField label="Tipo de Cenário"><Input value={form.scenario_type} onChange={e => setForm(f => ({ ...f, scenario_type: e.target.value }))} placeholder="Ex: Ciberataque sistémico, Comunicação de crise" /></FormField>
        <FormField label="Resultado / Lições Aprendidas"><Textarea value={form.outcome} onChange={e => setForm(f => ({ ...f, outcome: e.target.value }))} /></FormField>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={async () => {
            await t4Api.addCrossSectorExercise(pid, sprint, {
              exercise_name: form.exercise_name,
              exercise_date: form.exercise_date || null,
              organized_by: form.organized_by || null,
              participation_type: form.participation_type as T4CrossSectorExercise['participation_type'],
              scenario_type: form.scenario_type || null,
              outcome: form.outcome || null,
            }); onClose()
          }} disabled={!form.exercise_name}>Guardar</Button>
        </div>
      </div>
    </Modal>
  )
}
