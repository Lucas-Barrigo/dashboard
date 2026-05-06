import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { t0Api, type Template, type PillarQuestion } from '../../api'
import { Card, CardHeader, Button, Input, Spinner, Badge, Modal, FormField } from '../../components/ui'
import { Breadcrumbs } from '../../components/Layout'

export default function T0Page() {
  const { projectId } = useParams<{ projectId: string }>()
  const pid = Number(projectId)

  const [template, setTemplate] = useState<Template | null>(null)
  const [questions, setQuestions] = useState<PillarQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [approveModal, setApproveModal] = useState(false)
  const [approver, setApprover] = useState('')

  const load = async () => {
    setLoading(true)
    const [qs, existing] = await Promise.allSettled([
      t0Api.questions(pid),
      t0Api.get(pid),
    ])
    if (qs.status === 'fulfilled') setQuestions(qs.value)
    if (existing.status === 'fulfilled') {
      setTemplate(existing.value)
      const ans = await t0Api.answers(pid)
      const aMap: Record<string, boolean> = {}
      ans.forEach(a => { aMap[a.question_key] = a.answer })
      setAnswers(aMap)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [pid])

  const createTemplate = async () => {
    const t = await t0Api.create(pid)
    setTemplate(t)
  }

  const saveAnswers = async () => {
    if (!template) return
    setSaving(true)
    const payload = questions.map(q => ({
      question_key: q.question_key,
      answer: answers[q.question_key] ?? false,
    }))
    await t0Api.saveAnswers(pid, payload)
    await load()
    setSaving(false)
  }

  const approve = async () => {
    if (!approver.trim()) return
    try {
      const payload = questions.map(q => ({
        question_key: q.question_key,
        answer: answers[q.question_key] ?? false,
      }))
      await t0Api.saveAnswers(pid, payload)
      await t0Api.approve(pid, approver)
      setApproveModal(false)
      await load()
    } catch (e: any) {
      alert(e?.response?.data?.detail ?? 'Erro ao aprovar T0')
    }
  }

  if (loading) return <Spinner />

  const pillarGroups = ['P1', 'P2', 'P3', 'P4', 'P5']

  return (
    <div>
      <Breadcrumbs items={[
        { label: 'Projetos', to: '/' },
        { label: 'Projeto', to: `/projects/${pid}` },
        { label: 'T0 – Ativação de Pilares' },
      ]} />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">T0 – Ativação de Pilares DORA</h1>
          <p className="text-sm text-gray-500 mt-0.5">Responda às perguntas para ativar os pilares aplicáveis ao projeto</p>
        </div>
        {template && <Badge label={template.status} />}
      </div>

      {!template ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500 mb-4">O template T0 ainda não foi iniciado para este projeto.</p>
          <Button onClick={createTemplate}>Iniciar T0</Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {pillarGroups.map(pillar => {
            const qs = questions.filter(q => q.pillar === pillar)
            if (qs.length === 0) return null
            return (
              <Card key={pillar}>
                <CardHeader title={`Pilar ${pillar}`} />
                <div className="divide-y divide-gray-50">
                  {qs.map(q => (
                    <div key={q.question_key} className="px-5 py-4 flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="flex-1">
                        <p className="text-sm text-gray-800">{q.question_text}</p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name={`q-${q.question_key}`}
                            checked={answers[q.question_key] === true}
                            onChange={() => setAnswers(a => ({ ...a, [q.question_key]: true }))}
                            disabled={!!template.approved_by}
                            className="text-green-600"
                          />
                          <span className="text-sm text-green-700 font-medium">Sim</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name={`q-${q.question_key}`}
                            checked={answers[q.question_key] === false}
                            onChange={() => setAnswers(a => ({ ...a, [q.question_key]: false }))}
                            disabled={!!template.approved_by}
                            className="text-red-500"
                          />
                          <span className="text-sm text-red-600 font-medium">Não</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )
          })}

          {!template.approved_by && (
            <div className="flex gap-3 justify-end">
              {template.status === 'IN_PROGRESS' && (
                <Button variant="secondary" onClick={saveAnswers} disabled={saving}>
                  {saving ? 'A guardar...' : 'Guardar Respostas'}
                </Button>
              )}
              <Button onClick={() => setApproveModal(true)} disabled={template.status === 'IN_PROGRESS'}>
                Aprovar T0 & Ativar Pilares
              </Button>
            </div>
          )}

          {template.approved_by && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-700">
              T0 aprovado por <strong>{template.approved_by}</strong> em {new Date(template.approved_at!).toLocaleDateString('pt-PT')}.
              Os pilares foram ativados.
            </div>
          )}
        </div>
      )}

      {approveModal && (
        <Modal title="Aprovar T0" onClose={() => setApproveModal(false)}>
          <p className="text-sm text-gray-600 mb-4">
            Ao aprovar, os pilares DORA serão ativados com base nas respostas. Esta ação irá primeiro guardar as respostas atuais.
          </p>
          <FormField label="Aprovado por">
            <Input value={approver} onChange={e => setApprover(e.target.value)} placeholder="Nome do aprovador" />
          </FormField>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" onClick={() => setApproveModal(false)}>Cancelar</Button>
            <Button onClick={approve} disabled={!approver.trim()}>Confirmar Aprovação</Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
