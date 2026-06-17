import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, ArrowRight } from 'lucide-react'
import { projectsApi, type Project, type ProjectCreate } from '../api'
import { Card, Button, Input, FormField, Modal, Spinner, Empty } from '../components/ui'
import { Breadcrumbs } from '../components/Layout'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const navigate = useNavigate()

  const load = () => {
    setLoading(true)
    projectsApi.list().then(p => { setProjects(p); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Eliminar projeto "${name}"? Esta ação é irreversível.`)) return
    await projectsApi.delete(id)
    load()
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Projetos' }]} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projetos</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gerir projetos de conformidade DORA</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={15} /> Novo Projeto
        </Button>
      </div>

      {loading ? <Spinner /> : projects.length === 0 ? (
        <Empty message="Nenhum projeto ainda. Crie o primeiro." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map(p => (
            <Card key={p.id} className="flex flex-col">
              <div className="p-5 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-base font-semibold text-gray-900 leading-tight">{p.name}</h2>
                  <button
                    onClick={() => handleDelete(p.id, p.name)}
                    className="text-gray-300 hover:text-red-500 transition-colors shrink-0"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{p.institution} · {p.responsible}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(['p1', 'p2', 'p3', 'p4', 'p5'] as const).map(pk => {
                    const active = p[`${pk}_active` as keyof Project] as boolean
                    return (
                      <span
                        key={pk}
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          active ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {pk.toUpperCase()}
                      </span>
                    )
                  })}
                </div>
              </div>
              <div className="px-5 py-3 border-t border-gray-100 flex justify-end items-center">
                <Button variant="ghost" size="sm" onClick={() => navigate(`/projects/${p.id}/qualification`)}>
                  Abrir <ArrowRight size={13} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showModal && <NewProjectModal onClose={() => { setShowModal(false); load() }} />}
    </div>
  )
}

function NewProjectModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState<ProjectCreate>({ name: '', institution: '', responsible: '' })
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!form.name.trim() || !form.institution.trim() || !form.responsible.trim()) return
    setSaving(true)
    await projectsApi.create(form)
    setSaving(false)
    onClose()
  }

  return (
    <Modal title="Novo Projeto" onClose={onClose}>
      <div className="space-y-4">
        <FormField label="Nome do Projeto *">
          <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Sistema de Pagamentos" />
        </FormField>
        <FormField label="Instituição *">
          <Input value={form.institution} onChange={e => setForm(f => ({ ...f, institution: e.target.value }))} placeholder="Ex: Natixis CIB" />
        </FormField>
        <FormField label="Responsável *">
          <Input value={form.responsible} onChange={e => setForm(f => ({ ...f, responsible: e.target.value }))} placeholder="Ex: João Silva" />
        </FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={saving || !form.name.trim() || !form.institution.trim() || !form.responsible.trim()}>
            {saving ? 'A guardar...' : 'Criar Projeto'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
