import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, ChevronRight } from 'lucide-react'

export default function Layout({ children }: { children: React.ReactNode }) {
  const loc = useLocation()

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-gray-100">
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest">DORA</p>
          <h1 className="text-sm font-bold text-gray-900 leading-tight">Compliance Checklist</h1>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          <NavLink to="/" icon={<LayoutDashboard size={15} />} active={loc.pathname === '/'}>
            Projects
          </NavLink>
        </nav>
        <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">EU Reg 2022/2554</div>
      </aside>

      {/* Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 p-6 overflow-y-auto">{children}</div>
      </main>
    </div>
  )
}

function NavLink({
  to,
  icon,
  active,
  children,
}: {
  to: string
  icon: React.ReactNode
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
        active ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      {icon}
      {children}
    </Link>
  )
}

export function Breadcrumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav className="flex items-center gap-1 text-sm text-gray-500 mb-4">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight size={14} className="text-gray-300" />}
          {item.to ? (
            <Link to={item.to} className="hover:text-indigo-600 transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-800 font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
