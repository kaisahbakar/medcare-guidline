import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MdEdit, MdAdd } from 'react-icons/md'
import { supabase } from '../../lib/supabase'
import { useGuideTypes } from '../../lib/queries/useGuideTypes'
import { useAllCategories } from '../../lib/queries/useCategories'
import { useAllManuals } from '../../lib/queries/useManuals'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Select } from '../../components/ui/Select'
import { Modal } from '../../components/ui/Modal'
import { StatusBadge } from '../../components/ui/StatusBadge'

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getCategoryGuideTypeId(category) {
  return category?.guide_type_id ?? null
}

// ── Create manual modal ───────────────────────────────────────────────────────

function CreateManualModal({ open, onClose, guideTypes, categories }) {
  const qc = useQueryClient()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    title: '',
    summary: '',
    guide_type_id: '',
    category_id: '',
  })

  function set(field) {
    return (e) => {
      const value = e.target.value
      setForm((f) => {
        const next = { ...f, [field]: value }
        // Reset category when guide type changes
        if (field === 'guide_type_id') next.category_id = ''
        return next
      })
    }
  }

  const filteredCategories = categories?.filter((c) =>
    String(getCategoryGuideTypeId(c)) === String(form.guide_type_id),
  ) ?? []

  const mutation = useMutation({
    mutationFn: async (values) => {
      const { data, error } = await supabase
        .from('manual')
        .insert({
          title: values.title,
          summary: values.summary || null,
          category_id: values.category_id,
          guide_type_id: values.guide_type_id,
          status: 'draft',
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (manual) => {
      qc.invalidateQueries({ queryKey: ['manuals'] })
      onClose()
      navigate(`/admin/manuals/${manual.id}/edit`)
    },
  })

  function handleSubmit(e) {
    e.preventDefault()
    mutation.mutate(form)
  }

  return (
    <Modal open={open} onClose={onClose} title="Create Manual">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="m-title"
          label="Title"
          required
          value={form.title}
          onChange={set('title')}
          placeholder="e.g. Getting Started with MedCare"
        />

        <Select
          id="m-guide-type"
          label="Guide Type"
          required
          value={form.guide_type_id}
          onChange={set('guide_type_id')}
        >
          <option value="">Select a guide type…</option>
          {guideTypes?.map((gt) => (
            <option key={gt.id} value={gt.id}>
              {gt.name}
            </option>
          ))}
        </Select>

        <Select
          id="m-category"
          label="Category"
          required
          value={form.category_id}
          onChange={set('category_id')}
          disabled={!form.guide_type_id}
        >
          <option value="">
            {form.guide_type_id ? 'Select a category…' : 'Choose a guide type first'}
          </option>
          {filteredCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>

        <Textarea
          id="m-summary"
          label="Summary (optional)"
          value={form.summary}
          onChange={set('summary')}
          placeholder="Brief description shown in category listings"
          rows={2}
        />

        {mutation.isError && (
          <p className="text-sm text-red-600">{mutation.error.message}</p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Creating…' : 'Create manual'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ── Inline status change ──────────────────────────────────────────────────────

const STATUS_OPTIONS = ['draft', 'published', 'archived']

function StatusSelect({ manual }) {
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (status) => {
      const { error } = await supabase
        .from('manual')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', manual.id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manuals'] })
      qc.invalidateQueries({ queryKey: ['manual', manual.id] })
      qc.invalidateQueries({ queryKey: ['manuals', 'by-category', manual.category_id] })
      qc.invalidateQueries({
        queryKey: ['manuals', 'published-by-category', manual.category_id],
      })
    },
  })

  return (
    <select
      value={manual.status}
      onChange={(e) => mutation.mutate(e.target.value)}
      disabled={mutation.isPending}
      className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400 disabled:opacity-60"
    >
      {STATUS_OPTIONS.map((s) => (
        <option key={s} value={s}>
          {s.charAt(0).toUpperCase() + s.slice(1)}
        </option>
      ))}
    </select>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

function ManualListPage() {
  const navigate = useNavigate()
  const manualsQuery = useAllManuals()
  const guideTypesQuery = useGuideTypes()
  const categoriesQuery = useAllCategories()

  const [createOpen, setCreateOpen] = useState(false)

  // Filters
  const [filterGuideType, setFilterGuideType] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const categoryMap = useMemo(
    () => Object.fromEntries((categoriesQuery.data ?? []).map((c) => [c.id, c])),
    [categoriesQuery.data],
  )
  const guideTypeMap = useMemo(
    () => Object.fromEntries((guideTypesQuery.data ?? []).map((gt) => [gt.id, gt.name])),
    [guideTypesQuery.data],
  )

  // Categories for the filter dropdown — if a guide type filter is active,
  // only show categories belonging to that guide type.
  const filteredCategoriesForDropdown = (categoriesQuery.data ?? []).filter(
    (c) => !filterGuideType || String(getCategoryGuideTypeId(c)) === String(filterGuideType),
  )

  const manuals = (manualsQuery.data ?? []).filter((m) => {
    const category = categoryMap[m.category_id]
    if (filterGuideType && String(getCategoryGuideTypeId(category)) !== String(filterGuideType)) return false
    if (filterCategory && String(m.category_id) !== String(filterCategory)) return false
    if (filterStatus && m.status !== filterStatus) return false
    return true
  })

  const isLoading =
    manualsQuery.isLoading || guideTypesQuery.isLoading || categoriesQuery.isLoading
  const isError =
    manualsQuery.isError || guideTypesQuery.isError || categoriesQuery.isError
  const errorMsg =
    manualsQuery.error?.message ??
    guideTypesQuery.error?.message ??
    categoriesQuery.error?.message

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manuals</h1>
          <p className="mt-1 text-sm text-slate-500">
            All manuals across every guide type and category.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <MdAdd className="size-4" />
          Create Manual
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterGuideType}
          onChange={(e) => {
            setFilterGuideType(e.target.value)
            setFilterCategory('')
          }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
        >
          <option value="">All guide types</option>
          {guideTypesQuery.data?.map((gt) => (
            <option key={gt.id} value={gt.id}>
              {gt.name}
            </option>
          ))}
        </select>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
        >
          <option value="">All categories</option>
          {filteredCategoriesForDropdown.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>

        {(filterGuideType || filterCategory || filterStatus) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilterGuideType('')
              setFilterCategory('')
              setFilterStatus('')
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {isLoading && <p className="text-sm text-slate-500">Loading…</p>}
      {isError && <p className="text-sm text-red-600">{errorMsg}</p>}

      {!isLoading && !isError && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">Guide Type</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Updated</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {manuals.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    {manualsQuery.data?.length === 0
                      ? 'No manuals yet. Create your first one.'
                      : 'No manuals match the current filters.'}
                  </td>
                </tr>
              )}
              {manuals.map((manual) => {
                const category = categoryMap[manual.category_id]
                const guideTypeName =
                  guideTypeMap[getCategoryGuideTypeId(category)] ?? '—'

                return (
                  <tr key={manual.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <span className="font-medium text-slate-900">{manual.title}</span>
                      {manual.summary && (
                        <p className="mt-0.5 text-xs text-slate-400 line-clamp-1">
                          {manual.summary}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-500">{guideTypeName}</td>
                    <td className="px-5 py-3 text-slate-500">{category?.name ?? '—'}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={manual.status} />
                        <StatusSelect manual={manual} />
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-400">
                      {formatDate(manual.updated_at)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/manuals/${manual.id}/edit`)}
                          aria-label="Edit"
                        >
                          <MdEdit className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <CreateManualModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        guideTypes={guideTypesQuery.data}
        categories={categoriesQuery.data}
      />
    </div>
  )
}

export default ManualListPage
