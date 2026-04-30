import { useQuery } from '@tanstack/react-query'
import { supabase } from '../supabase'

export function useManualsByCategory(categoryId) {
  return useQuery({
    queryKey: ['manuals', 'by-category', categoryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('manual')
        .select('*')
        .eq('category_id', categoryId)
        .order('title')

      if (error) throw error
      return data
    },
    enabled: !!categoryId,
  })
}

export function useManual(manualId) {
  return useQuery({
    queryKey: ['manual', manualId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('manual')
        .select('*')
        .eq('id', manualId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!manualId,
  })
}

export function useAllManuals() {
  return useQuery({
    queryKey: ['manuals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('manual')
        .select('*')
        .order('title')

      if (error) throw error
      return data
    },
  })
}

export function usePublishedManualsByCategory(categoryId) {
  return useQuery({
    queryKey: ['manuals', 'published-by-category', categoryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('manual')
        .select('*')
        .eq('category_id', categoryId)
        .eq('status', 'published')
        .order('title')

      if (error) throw error
      return data
    },
    enabled: !!categoryId,
  })
}
