import { useQuery } from '@tanstack/react-query'
import { supabase } from '../supabase'

export function useCategoriesByGuideType(guideTypeId) {
  return useQuery({
    queryKey: ['categories', 'by-guide-type', guideTypeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('category')
        .select('*')
        .eq('guide_type_id', guideTypeId)
        .order('name')

      if (error) throw error
      return data
    },
    enabled: !!guideTypeId,
  })
}

export function useAllCategories() {
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

export function useCategory(categoryId) {
  return useQuery({
    queryKey: ['category', categoryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('category')
        .select('*')
        .eq('id', categoryId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!categoryId,
  })
}
