import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MdEdit, MdAdd, MdDelete } from 'react-icons/md'
import { supabase } from '../../lib/supabase'
import { useGuideTypes } from '../../lib/queries/useGuideTypes'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Modal } from '../../components/ui/Modal'

// ── Data helpers ─────────────────────────────────────────────────────────────

function useCategoriesAdmin() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('category')
        .select('*')
        .order('name')
      if (error) throw error
      return data
    },
  })
}

function getGuideTypeId(category) {
  return category?.guide_type_id ?? null
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// ── Form modal ────────────────────────────────────────────────────────────────

function CategoryFormModal({ open, onClose, initial, guideTypes }) {
  const qc = useQueryClient()
  const isEdit = !!initial

  const getInitialForm = () => ({
    name: initial?.name ?? '',
    guide_type_id: getGuideTypeId(initial) ?? '',
  })

  const [form, setForm] = useState(getInitialForm)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!open) {
      setForm({ name: '', guide_type_id: '' })
      setConfirmDelete(false)
      return
    }
    setForm(getInitialForm())
    setConfirmDelete(false)
  }, [open, initial])

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  const saveMutation = useMutation({
    mutationFn: async (values) => {
      const payload = {
        name: values.name,
        guide_type_id: values.guide_type_id,
      }
      if (isEdit) {
        const { error } = await supabase
          .from('category')
          .update(payload)
          .eq('id', initial.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('category').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      onClose()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('category')
        .delete()
        .eq('id', initial.id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      qc.invalidateQueries({ queryKey: ['manuals'] })
      onClose()
    },
  })

  function handleSubmit(e) {
    e.preventDefault()
    saveMutation.mutate(form)
  }

  if (!open) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Category' : 'Add Category'}
    >
      {confirmDelete ? (
        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            Are you sure you want to delete{' '}
            <strong className="font-semibold">{initial?.name}</strong>? All
            manuals in this category will also be removed.
          </p>
          {deleteMutation.isError && (
            <p className="text-sm text-red-600">{deleteMutation.error.message}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            id="cat-guide-type"
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

          <Input
            id="cat-name"
            label="Category Name"
            required
            value={form.name}
            onChange={set('name')}
            placeholder="e.g. Getting Started"
          />

          {saveMutation.isError && (
            <p className="text-sm text-red-600">{saveMutation.error.message}</p>
          )}

          <div className="flex items-center justify-between pt-1">
            {isEdit && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700"
              >
                <MdDelete className="size-4" />
                Delete
              </button>
            )}
            <div className={`flex gap-2 ${isEdit ? '' : 'ml-auto'}`}>
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Add category'}
              </Button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

function CategoriesPage() {
  const categoriesQuery = useCategoriesAdmin()
  const guideTypesQuery = useGuideTypes()

  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)

  const guideTypeMap = Object.fromEntries(
    (guideTypesQuery.data ?? []).map((gt) => [gt.id, gt.name]),
  )

  const isLoading = categoriesQuery.isLoading || guideTypesQuery.isLoading
  const isError = categoriesQuery.isError || guideTypesQuery.isError
  const errorMsg =
    categoriesQuery.error?.message ?? guideTypesQuery.error?.message

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-8 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage categories within each guide type.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <MdAdd className="size-4" />
          Add Category
        </Button>
      </div>

      {isLoading && <p className="text-sm text-slate-500">Loading…</p>}
      {isError && <p className="text-sm text-red-600">{errorMsg}</p>}

      {!isLoading && !isError && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Guide Type</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categoriesQuery.data?.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                    No categories yet.
                  </td>
                </tr>
              )}
              {categoriesQuery.data?.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-900">{cat.name}</td>
                  <td className="px-5 py-3 text-slate-500">
                    {guideTypeMap[getGuideTypeId(cat)] ?? '—'}
                  </td>
                  <td className="px-5 py-3 text-slate-400">{formatDate(cat.created_at)}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditTarget(cat)}
                        aria-label="Edit"
                      >
                        <MdEdit className="size-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CategoryFormModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        guideTypes={guideTypesQuery.data}
      />
      <CategoryFormModal
        key={editTarget?.id ?? '__edit__'}
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        initial={editTarget}
        guideTypes={guideTypesQuery.data}
      />
    </div>
  )
}

export default CategoriesPage
