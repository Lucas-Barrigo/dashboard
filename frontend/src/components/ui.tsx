import React from 'react'

// ── Badge ─────────────────────────────────────────────────────────────────

const badgeColors: Record<string, string> = {
  HIGH: 'bg-red-100 text-red-800',
  CRITICAL: 'bg-red-100 text-red-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  LOW: 'bg-blue-100 text-blue-800',
  COMPLETE: 'bg-green-100 text-green-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  COLLECTED: 'bg-green-100 text-green-800',
  INCOMPLETE: 'bg-yellow-100 text-yellow-800',
  MISSING: 'bg-red-100 text-red-800',
  NA: 'bg-gray-100 text-gray-500',
  PASS: 'bg-green-100 text-green-800',
  FAIL: 'bg-red-100 text-red-800',
  PARTIAL: 'bg-yellow-100 text-yellow-800',
  OPEN: 'bg-red-100 text-red-800',
  MITIGATED: 'bg-green-100 text-green-800',
  ACCEPTED: 'bg-gray-100 text-gray-600',
}

export function Badge({ label }: { label: string }) {
  const cls = badgeColors[label] ?? 'bg-gray-100 text-gray-700'
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{label}</span>
}

// ── Card ──────────────────────────────────────────────────────────────────

export function Card({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`} onClick={onClick}>{children}</div>
}

export function CardHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
      <h2 className="text-base font-semibold text-gray-800">{title}</h2>
      {action}
    </div>
  )
}

// ── Button ────────────────────────────────────────────────────────────────

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

const variantCls: Record<Variant, string> = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
  secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'text-gray-500 hover:text-gray-800 hover:bg-gray-100',
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  type = 'button',
  disabled = false,
  className = '',
}: {
  children: React.ReactNode
  variant?: Variant
  size?: 'sm' | 'md'
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
  className?: string
}) {
  const sizeCls = size === 'sm' ? 'px-3 py-1 text-sm' : 'px-4 py-2 text-sm'
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${sizeCls} ${variantCls[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

// ── Input / Select / Checkbox ─────────────────────────────────────────────

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${props.className ?? ''}`}
    />
  )
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={3}
      {...props}
      className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${props.className ?? ''}`}
    />
  )
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white ${props.className ?? ''}`}
    />
  )
}

export function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  )
}

// ── FormField ─────────────────────────────────────────────────────────────

export function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

// ── Table ─────────────────────────────────────────────────────────────────

export function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-100 text-sm">
        <thead>
          <tr>
            {headers.map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">{children}</tbody>
      </table>
    </div>
  )
}

export function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-gray-700 ${className}`}>{children}</td>
}

// ── Empty state ───────────────────────────────────────────────────────────

export function Empty({ message }: { message: string }) {
  return <p className="text-center text-sm text-gray-400 py-8">{message}</p>
}

// ── Loading spinner ───────────────────────────────────────────────────────

export function Spinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
    </div>
  )
}

// ── Score ring ────────────────────────────────────────────────────────────

export function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const r = (size - 10) / 2
  const circ = 2 * Math.PI * r
  const fill = (score / 100) * circ
  const color = score >= 80 ? '#16a34a' : score >= 50 ? '#d97706' : '#dc2626'
  return (
    <svg width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={8} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={8}
        strokeDasharray={`${fill} ${circ - fill}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x={size / 2} y={size / 2 + 5} textAnchor="middle" fontSize={14} fontWeight="600" fill={color}>
        {Math.round(score)}%
      </text>
    </svg>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────

export function Modal({
  title,
  onClose,
  children,
  size = 'md',
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
  size?: 'md' | 'lg'
}) {
  const widthCls = size === 'lg' ? 'max-w-3xl' : 'max-w-lg'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className={`bg-white rounded-xl shadow-xl w-full ${widthCls} mx-4 max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}
