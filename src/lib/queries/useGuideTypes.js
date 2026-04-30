import { useQuery } from '@tanstack/react-query'
import { supabase } from '../supabase'

export function useGuideTypes() {
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

export function useGuideType(guideTypeId) {
  return useQuery({
    queryKey: ['guide-type', guideTypeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_guide_type')
        .select('*')
        .eq('id', guideTypeId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!guideTypeId,
  })
}
