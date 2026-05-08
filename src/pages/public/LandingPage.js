import {
  MdMenuBook,
  MdChevronRight,
  MdLocalHospital,
  MdMedicalServices,
  MdPerson,
  MdPeople,
  MdAdminPanelSettings,
} from 'react-icons/md'
import { Link } from 'react-router-dom'
import { useGuideTypes } from '../../lib/queries/useGuideTypes'
import { useAllCategories } from '../../lib/queries/useCategories'
import { CardSkeleton } from '../../components/ui/Skeleton'
import ErrorCard from '../../components/ui/ErrorCard'
import EmptyState from '../../components/ui/EmptyState'

// ── Role icon + description maps (keyed by lowercase guide type name) ──────────

const ROLE_ICONS = {
  doctor: MdLocalHospital,
  nurse: MdMedicalServices,
  patient: MdPerson,
  staff: MdPeople,
  admin: MdAdminPanelSettings,
}

const ROLE_DESCRIPTIONS = {
  doctor: 'Clinical workflows, prescriptions, and protocols',
  nurse: 'Patient care procedures and nursing guidelines',
  patient: 'Your care plan, appointments, and health information',
  staff: 'Operational procedures and staff resources',
  admin: 'System configuration and administrative tools',
}

function getRoleIcon(name) {
  return ROLE_ICONS[name?.toLowerCase()] ?? MdMenuBook
}

function getRoleDescription(guideType) {
  if (guideType.description) return guideType.description
  return ROLE_DESCRIPTIONS[guideType.name?.toLowerCase()] ?? null
}

// ── Page ──────────────────────────────────────────────────────────────────────

function LandingPage() {
  const { data, isLoading, isError, error, refetch } = useGuideTypes()
  const allCategoriesQuery = useAllCategories()

  function getCategoriesForGuideType(guideTypeId) {
    if (!Array.isArray(allCategoriesQuery.data)) return []
    return allCategoriesQuery.data.filter(
      (c) => String(c.guide_type_id) === String(guideTypeId),
    )
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-57px)] w-full max-w-5xl flex-col justify-center px-4 py-10 sm:px-6 animate-fade-in">
      <header className="mb-10 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          MedCare User Manuals
        </h1>
        <p className="text-base text-slate-500">
          Browse guides by role to find the information you need.
        </p>
      </header>

      {/* Error */}
      {isError && (
        <ErrorCard
          title="Failed to load guide types"
          message={error?.message}
          onRetry={refetch}
        />
      )}

      {/* Skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && (!data || data.length === 0) && (
        <EmptyState icon={MdMenuBook} message="No guide types available yet." />
      )}

      {/* Cards */}
      {!isLoading && !isError && data && data.length > 0 && (
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((guideType) => {
            const categories = getCategoriesForGuideType(guideType.id)
            const Icon = getRoleIcon(guideType.name)
            const description = getRoleDescription(guideType)
            return (
              <Link
                key={guideType.id}
                to={`/guide-type/${guideType.id}`}
                className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
              >
                <div className="flex flex-1 items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Icon className="size-5 shrink-0 text-blue-600" />
                      <h2 className="text-base font-semibold text-slate-900 group-hover:text-blue-700">
                        {guideType.name}
                      </h2>
                    </div>
                    {description && (
                      <p className="text-sm leading-relaxed text-slate-500">
                        {description}
                      </p>
                    )}
                  </div>
                  <MdChevronRight className="mt-0.5 size-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-500" />
                </div>
                {categories.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {categories.map((c) => (
                      <span
                        key={c.id}
                        className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs text-blue-600"
                      >
                        {c.name}
                      </span>
                    ))}
                  </div>
                )}
                <p className="mt-3 text-xs font-medium text-slate-400">
                  {categories.length}{' '}
                  {categories.length === 1 ? 'category' : 'categories'}
                </p>
              </Link>
            )
          })}
        </section>
      )}
    </main>
  )
}

export default LandingPage
