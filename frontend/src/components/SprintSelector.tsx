import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Badge, Button, Modal, Input, FormField } from './ui'
import type { Template } from '../api'

interface Props {
  templates: Template[]
  selected: number | null
  onSelect: (sprint: number) => void
  onCreate: (sprint: number) => Promise<void>
}

export default function SprintSelector({ templates, selected, onSelect, onCreate }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [sprintNum, setSprintNum] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const close = () => { setShowModal(false); setError(''); setSprintNum('') }

  const create = async () => {
    const n = parseInt(sprintNum)
    if (!n || n < 1) return
    setCreating(true)
    setError('')
    try {
      await onCreate(n)
      close()
    } catch (e: any) {
      const detail = e?.response?.data?.detail ?? `Sprint ${n} já existe para esta fase.`
      setError(detail)
    } finally {
      setCreating(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap mb-5">
        {templates.map(t => (
          <button
            key={t.sprint_number}
            onClick={() => onSelect(t.sprint_number!)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              selected === t.sprint_number
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400'
            }`}
          >
            Sprint {t.sprint_number}
            <Badge label={t.status} />
          </button>
        ))}
        <Button variant="ghost" size="sm" onClick={() => setShowModal(true)}>
          <Plus size={14} /> Novo Sprint
        </Button>
      </div>

      {showModal && (
        <Modal title="Criar Novo Sprint" onClose={close}>
          <FormField label="Número do Sprint">
            <Input
              type="number"
              min={1}
              value={sprintNum}
              onChange={e => { setSprintNum(e.target.value); setError('') }}
              placeholder="Ex: 1"
              autoFocus
            />
          </FormField>
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" onClick={close}>Cancelar</Button>
            <Button onClick={create} disabled={creating || !sprintNum}>
              {creating ? 'A criar...' : 'Criar'}
            </Button>
          </div>
        </Modal>
      )}
    </>
  )
}
