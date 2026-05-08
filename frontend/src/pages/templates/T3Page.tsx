import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Trash2, Plus } from 'lucide-react'
import { t3Api, sectionNaApi, type Template, type T3Data, type T3PipelineScan, type T3Dependency, type SectionExclusion } from '../../api'
import {
  Card, CardHeader, Button, Input, Select, Textarea, FormField,
  Checkbox, Badge, Modal, Table, Td, Spinner, Empty,
} from '../../components/ui'
import { Breadcrumbs } from '../../components/Layout'
import SprintSelector from '../../components/SprintSelector'
import SectionNA from '../../components/SectionNA'

export default function T3Page() {
  const { projectId } = useParams<{ projectId: string }>()
  const pid = Number(projectId)
  const [templates, setTemplates] = useState<Template[]>([])
  const [sprint, setSprint] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const loadTemplates = async () => {
    const ts = await t3Api.list(pid)
    setTemplates(ts)
    if (ts.length > 0 && sprint === null) setSprint(ts[ts.length - 1].sprint_number!)
    setLoading(false)
  }
  useEffect(() => { loadTemplates() }, [pid])

  if (loading) return <Spinner />
  const current = templates.find(t => t.sprint_number === sprint) ?? null

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Projetos', to: '/' }, { label: 'Projeto', to: `/projects/${pid}` }, { label: 'T3 – Pipeline DevSecOps' }]} />
      <h1 className="text-2xl font-bold text-gray-900 mb-1">T3 – Pipeline de Segurança DevSecOps</h1>
      <p className="text-sm text-gray-500 mb-4">SAST, SCA, IaC, DAST, logging e gestão de dependências por sprint</p>
      <SprintSelector templates={templates} selected={sprint} onSelect={setSprint}
        onCreate={async n => { await t3Api.create(pid, n); await loadTemplates(); setSprint(n) }} />
      {sprint && current
        ? <T3Content pid={pid} sprint={sprint} template={current} locked={current.status === 'COMPLETE'} onRefresh={loadTemplates} />
        : <Empty message="Selecione ou crie um sprint." />}
    </div>
  )
}

function T3Content({ pid, sprint, template, locked, onRefresh }: { pid: number; sprint: number; template: Template; locked: boolean; onRefresh: () => void }) {
  const [data, setData] = useState<T3Data | null>(null)
  const [scans, setScans] = useState<T3PipelineScan[]>([])
  const [deps, setDeps] = useState<T3Dependency[]>([])
  const [exclusions, setExclusions] = useState<SectionExclusion[]>([])
  const [saving, setSaving] = useState(false)
  const [approveModal, setApproveModal] = useState(false)
  const [approver, setApprover] = useState('')
  const [scanModal, setScanModal] = useState(false)
  const [depModal, setDepModal] = useState(false)

  const load = async () => {
    const [d, s, dp, excl] = await Promise.allSettled([
      t3Api.getData(pid, sprint), t3Api.scans(pid, sprint), t3Api.dependencies(pid, sprint),
      sectionNaApi.list(pid, 'T3', sprint),
    ])
    if (d.status === 'fulfilled') setData(d.value)
    else setData({ template_id: 0, owasp_guidelines_followed: false, code_review_completed: false, secrets_management_active: false, input_validation_active: false, auth_mechanisms_documented: false, structured_logging_active: false, audit_trail_auto_generated: false, log_retention_7yr: false, tamper_protection_active: false, dependency_inventory_updated: false, supplier_access_monitored: false, systems_capacity_assessed: false, patches_applied_or_planned: false, notes: null })
    if (s.status === 'fulfilled') setScans(s.value)
    if (dp.status === 'fulfilled') setDeps(dp.value)
    if (excl.status === 'fulfilled') setExclusions(excl.value)
  }
  useEffect(() => { load() }, [pid, sprint])

  const saveData = async () => { if (!data) return; setSaving(true); await t3Api.saveData(pid, sprint, data); setSaving(false) }
  const initData = async () => {
    const d = await t3Api.saveData(pid, sprint, {
      owasp_guidelines_followed: false, code_review_completed: false, secrets_management_active: false,
      input_validation_active: false, auth_mechanisms_documented: false, structured_logging_active: false,
      audit_trail_auto_generated: false, log_retention_7yr: false, tamper_protection_active: false,
      dependency_inventory_updated: false, supplier_access_monitored: false,
      systems_capacity_assessed: false, patches_applied_or_planned: false,
    })
    setData(d)
  }
  const approve = async () => { if (!approver.trim()) return; await t3Api.approve(pid, sprint, approver); setApproveModal(false); onRefresh() }

  const totalCritical = scans.reduce((s, sc) => s + sc.critical_vulns, 0)

  const boolField = (key: keyof T3Data, label: string) => (
    <Checkbox key={key} label={label} checked={(data?.[key] as boolean) ?? false}
      onChange={v => setData(d => d && { ...d, [key]: v })} />
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge label={template.status} />
          {totalCritical > 0 && <span className="text-xs text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded">{totalCritical} vuln. críticas</span>}
        </div>
        {!locked && <Button onClick={() => setApproveModal(true)}>Fechar Sprint</Button>}
        {locked && <span className="text-sm text-green-700">Aprovado por {template.approved_by}</span>}
      </div>

      <Card>
        <CardHeader title="Checklist DevSecOps" />
        <div className="p-5">
          <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Código & Segurança</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {boolField('owasp_guidelines_followed', 'OWASP guidelines seguidas')}
                  {boolField('code_review_completed', 'Code review completo')}
                  {boolField('secrets_management_active', 'Gestão de secrets ativa')}
                  {boolField('input_validation_active', 'Validação de input ativa')}
                  {boolField('auth_mechanisms_documented', 'Mecanismos de autenticação documentados')}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Logging & Auditoria</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {boolField('structured_logging_active', 'Structured logging ativo')}
                  {boolField('audit_trail_auto_generated', 'Audit trail gerado automaticamente')}
                  {boolField('log_retention_7yr', 'Retenção de logs ≥ 7 anos')}
                  {boolField('tamper_protection_active', 'Proteção contra adulteração ativa')}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Dependências & Fornecedores</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {boolField('dependency_inventory_updated', 'Inventário de dependências atualizado')}
                  {boolField('supplier_access_monitored', 'Acessos de fornecedores monitorizados')}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Sistemas TIC – Art. 7</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {boolField('systems_capacity_assessed',  'Capacidade dos sistemas TIC avaliada')}
                  {boolField('patches_applied_or_planned', 'Patches e atualizações aplicados ou planeados')}
                </div>
              </div>
              <FormField label="Notas"><Textarea value={data?.notes ?? ''} disabled={locked} onChange={e => setData(d => d && { ...d, notes: e.target.value })} /></FormField>
              {!locked && <Button variant="secondary" onClick={saveData} disabled={saving}>{saving ? 'A guardar...' : 'Guardar'}</Button>}
            </div>
        </div>
      </Card>

      <SectionNA pid={pid} templateType="T3" sprint={sprint} sectionKey="pipeline"
        title="Pipeline Scans" action={!locked && <Button size="sm" onClick={() => setScanModal(true)}><Plus size={14} /> Adicionar</Button>}
        exclusion={exclusions.find(e => e.section_key === 'pipeline') ?? null} onChanged={load}>
        {scans.length === 0 ? <Empty message="Nenhum scan registado." /> : (
          <Table headers={['Tipo', 'Fase', 'Ambiente', 'Ferramenta', 'Resultado', 'Críticos', 'Data', '']}>
            {scans.map(s => (
              <tr key={s.id}>
                <Td><Badge label={s.scan_type} /></Td>
                <Td className="text-xs">{s.pipeline_stage}</Td>
                <Td className="text-xs">{s.environment}</Td>
                <Td className="text-xs text-gray-500">{s.tool_used ?? '–'}</Td>
                <Td><Badge label={s.result} /></Td>
                <Td className={s.critical_vulns > 0 ? 'text-red-600 font-semibold' : ''}>{s.critical_vulns}</Td>
                <Td className="text-xs text-gray-400">{s.scan_date ? new Date(s.scan_date).toLocaleDateString('pt-PT') : '–'}</Td>
                <Td>{!locked && <button onClick={async () => { await t3Api.deleteScan(pid, sprint, s.id); load() }} className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button>}</Td>
              </tr>
            ))}
          </Table>
        )}
      </SectionNA>

      <SectionNA pid={pid} templateType="T3" sprint={sprint} sectionKey="dependencies"
        title="Dependências" action={!locked && <Button size="sm" onClick={() => setDepModal(true)}><Plus size={14} /> Adicionar</Button>}
        exclusion={exclusions.find(e => e.section_key === 'dependencies') ?? null} onChanged={load}>
        {deps.length === 0 ? <Empty message="Nenhuma dependência registada." /> : (
          <Table headers={['Package', 'Versão', 'CVE', 'CVSS', 'Status', '']}>
            {deps.map(d => (
              <tr key={d.id}>
                <Td className="font-mono text-xs">{d.package_name}</Td>
                <Td className="text-xs text-gray-500">{d.version ?? '–'}</Td>
                <Td className="text-xs font-mono">{d.cve_id ?? '–'}</Td>
                <Td className={d.cvss_score != null && d.cvss_score >= 7 ? 'text-red-600 font-semibold' : ''}>{d.cvss_score ?? '–'}</Td>
                <Td><Badge label={d.status} /></Td>
                <Td>{!locked && <button onClick={async () => { await t3Api.deleteDependency(pid, sprint, d.id); load() }} className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button>}</Td>
              </tr>
            ))}
          </Table>
        )}
      </SectionNA>

      {scanModal && <ScanModal pid={pid} sprint={sprint} onClose={() => { setScanModal(false); load() }} />}
      {depModal && <DepModal pid={pid} sprint={sprint} existingPackages={deps.map(d => d.package_name)} onClose={() => { setDepModal(false); load() }} />}
      {approveModal && (
        <Modal title="Fechar Sprint T3" onClose={() => setApproveModal(false)}>
          <p className="text-sm text-gray-500 mb-3">Serão bloqueados fechamentos com vulnerabilidades CVSS ≥ 7.0 por resolver.</p>
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

function ScanModal({ pid, sprint, onClose }: { pid: number; sprint: number; onClose: () => void }) {
  const [form, setForm] = useState({ scan_type: 'SAST', pipeline_stage: 'BUILD', environment: 'DEV', tool_used: '', scan_date: '', result: 'PASS', critical_vulns: 0, report_ref: '' })
  return (
    <Modal title="Novo Scan" onClose={onClose}>
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <FormField label="Tipo *"><Select value={form.scan_type} onChange={e => setForm(f => ({ ...f, scan_type: e.target.value }))}><option>SAST</option><option>SCA</option><option>IAC</option><option>DAST</option></Select></FormField>
          <FormField label="Fase Pipeline"><Select value={form.pipeline_stage} onChange={e => setForm(f => ({ ...f, pipeline_stage: e.target.value }))}><option>BUILD</option><option>TEST</option><option>DEPLOY</option></Select></FormField>
          <FormField label="Ambiente"><Select value={form.environment} onChange={e => setForm(f => ({ ...f, environment: e.target.value }))}><option>DEV</option><option>STAGING</option><option>PROD</option></Select></FormField>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <FormField label="Resultado *"><Select value={form.result} onChange={e => setForm(f => ({ ...f, result: e.target.value }))}><option>PASS</option><option>FAIL</option><option>PARTIAL</option></Select></FormField>
          <FormField label="Críticos (CVSS≥7)"><Input type="number" min={0} value={form.critical_vulns} onChange={e => setForm(f => ({ ...f, critical_vulns: Number(e.target.value) }))} /></FormField>
          <FormField label="Ferramenta"><Input value={form.tool_used} onChange={e => setForm(f => ({ ...f, tool_used: e.target.value }))} placeholder="Ex: SonarQube" /></FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Data de Execução"><Input type="date" value={form.scan_date} onChange={e => setForm(f => ({ ...f, scan_date: e.target.value }))} /></FormField>
          <FormField label="Ref. Relatório"><Input value={form.report_ref} onChange={e => setForm(f => ({ ...f, report_ref: e.target.value }))} /></FormField>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={async () => {
            await t3Api.addScan(pid, sprint, {
              scan_type: form.scan_type as T3PipelineScan['scan_type'],
              pipeline_stage: form.pipeline_stage as T3PipelineScan['pipeline_stage'],
              environment: form.environment as T3PipelineScan['environment'],
              result: form.result as T3PipelineScan['result'],
              critical_vulns: form.critical_vulns,
              tool_used: form.tool_used || null, scan_date: form.scan_date || null,
              report_ref: form.report_ref || null,
            }); onClose()
          }}>Guardar</Button>
        </div>
      </div>
    </Modal>
  )
}

function DepModal({ pid, sprint, existingPackages, onClose }: { pid: number; sprint: number; existingPackages: string[]; onClose: () => void }) {
  const [form, setForm] = useState({ package_name: '', version: '', cve_id: '', cvss_score: '', status: 'OK' })
  const dupPkg = form.package_name.trim() !== '' && existingPackages.some(p => p.toLowerCase() === form.package_name.trim().toLowerCase())
  return (
    <Modal title="Nova Dependência" onClose={onClose}>
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <FormField label="Package *">
              <Input value={form.package_name} onChange={e => setForm(f => ({ ...f, package_name: e.target.value }))} placeholder="Ex: lodash" />
              {dupPkg && <p className="text-xs text-red-500 mt-1">Package já registado neste sprint.</p>}
            </FormField>
          </div>
          <FormField label="Versão"><Input value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} placeholder="4.17.21" /></FormField>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2"><FormField label="CVE ID"><Input value={form.cve_id} onChange={e => setForm(f => ({ ...f, cve_id: e.target.value }))} placeholder="CVE-2021-1234" /></FormField></div>
          <FormField label="CVSS Score"><Input type="number" step="0.1" min={0} max={10} value={form.cvss_score} onChange={e => setForm(f => ({ ...f, cvss_score: e.target.value }))} /></FormField>
        </div>
        <FormField label="Status"><Select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}><option>OK</option><option>VULNERABLE</option><option>PATCHED</option><option>PENDING</option></Select></FormField>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={async () => {
            await t3Api.addDependency(pid, sprint, {
              package_name: form.package_name, version: form.version || null,
              cve_id: form.cve_id || null,
              cvss_score: form.cvss_score ? Number(form.cvss_score) : null,
              status: form.status as T3Dependency['status'],
            }); onClose()
          }} disabled={!form.package_name || dupPkg}>Guardar</Button>
        </div>
      </div>
    </Modal>
  )
}


