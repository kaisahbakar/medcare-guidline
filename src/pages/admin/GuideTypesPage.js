import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Modal } from '../../components/ui/Modal'

// ── Helpers ──────────────────────────────────────────────────────────────────

function useGuideTypesAdmin() {
  return useQuery({
    queryKey: ['guide-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_guide_type')
        .select('*')
        .order('name')
      if (error) throw error
      return data
    },
  })
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// ── Form modal (create / edit) ───────────────────────────────────────────────

const empty = { name: '', description: '' }

function GuideTypeFormModal({ open, onClose, initial }) {
  const qc = useQueryClient()
  const isEdit = !!initial

  const [form, setForm] = useState(initial ?? empty)

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  const mutation = useMutation({
    mutationFn: async (values) => {
      if (isEdit) {
        const { error } = await supabase
          .from('user_guide_type')
          .update({ name: values.name, description: values.description })
          .eq('id', initial.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('user_guide_type')
          .insert({ name: values.name, description: values.description })
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['guide-types'] })
      onClose()
    },
  })

  function handleSubmit(e) {
    e.preventDefault()
    mutation.mutate(form)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Guide Type' : 'Add Guide Type'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="gt-name"
          label="Name"
          required
          value={form.name}
          onChange={set('name')}
          placeholder="e.g. Patient Guide"
        />
        <Textarea
          id="gt-desc"
          label="Description"
          value={form.description ?? ''}
          onChange={set('description')}
          placeholder="Short description (optional)"
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
            {mutation.isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Add guide type'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ── Delete confirmation modal ─────────────────────────────────────────────────

function DeleteGuideTypeModal({ open, onClose, guideType }) {
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('user_guide_type')
        .delete()
        .eq('id', guideType.id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['guide-types'] })
      qc.invalidateQueries({ queryKey: ['categories'] })
      onClose()
    },
  })

  return (
    <Modal open={open} onClose={onClose} title="Delete Guide Type">
      <div className="space-y-4">
        <p className="text-sm text-slate-700">
          Are you sure you want to delete{' '}
          <strong className="font-semibold">{guideType?.name}</strong>? This will
          also remove all associated categories and manuals.
        </p>

        {mutation.isError && (
          <p className="text-sm text-red-600">{mutation.error.message}</p>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

function GuideTypesPage() {
  const { data: guideTypes, isLoading, isError, error } = useGuideTypesAdmin()

  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null) // guideType object
  const [deleteTarget, setDeleteTarget] = useState(null)

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-8 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Guide Types</h1>
          <p className="mt-1 text-sm text-slate-500">
            Top-level guide type definitions.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="size-4" />
          Add Guide Type
        </Button>
      </div>

      {isLoading && <p className="text-sm text-slate-500">Loading…</p>}
      {isError && (
        <p className="text-sm text-red-600">{error?.message}</p>
      )}

      {!isLoading && !isError && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Description</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {guideTypes?.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                    No guide types yet.
                  </td>
                </tr>
              )}
              {guideTypes?.map((gt) => (
                <tr key={gt.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-900">{gt.name}</td>
                  <td className="px-5 py-3 text-slate-500">{gt.description || '—'}</td>
                  <td className="px-5 py-3 text-slate-400">{formatDate(gt.created_at)}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditTarget(gt)}
                        aria-label="Edit"
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget(gt)}
                        aria-label="Delete"
                        className="text-red-500 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <GuideTypeFormModal open={addOpen} onClose={() => setAddOpen(false)} />
      <GuideTypeFormModal
        key={editTarget?.id ?? '__edit__'}
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        initial={editTarget}
      />
      <DeleteGuideTypeModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        guideType={deleteTarget}
      />
    </div>
  )
}

export default GuideTypesPage
