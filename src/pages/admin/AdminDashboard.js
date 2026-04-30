import { Link } from 'react-router-dom'
import { BookOpen, FolderOpen, Tag } from 'lucide-react'
import { Card } from '../../components/ui/Card'

const sections = [
  {
    to: '/admin/manuals',
    icon: BookOpen,
    title: 'Manage Manuals',
    description: 'Create, edit, publish, and delete manuals across all guide types.',
  },
  {
    to: '/admin/guide-types',
    icon: Tag,
    title: 'Guide Types',
    description: 'Define the top-level guide types: Patient, Doctor, Nurse, etc.',
  },
  {
    to: '/admin/categories',
    icon: FolderOpen,
    title: 'Categories',
    description: 'Organise manuals into categories within each guide type.',
  },
]

function AdminDashboard() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-8 py-10">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Admin</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage content for the MedCare Guideline System.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {sections.map(({ to, icon: Icon, title, description }) => (
          <Link key={to} to={to}>
            <Card className="group h-full transition hover:border-slate-300 hover:shadow-md">
              <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition group-hover:bg-slate-200">
                <Icon className="size-5" />
              </div>
              <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default AdminDashboard
