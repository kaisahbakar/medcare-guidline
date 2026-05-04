import { useQuery } from '@tanstack/react-query'
import { supabase } from '../supabase'

export function useManualSearch(query) {
  const trimmed = query?.trim() ?? ''
  // Escape LIKE special chars so user input is treated as a literal substring
  const escaped = trimmed.replace(/[%_\\]/g, '\\$&')

  return useQuery({
    queryKey: ['search', trimmed],
    queryFn: async () => {
      // category.guide_type_id → user_guide_type (hint matches real FK column name)
      const { data, error } = await supabase
        .from('manual')
        .select(`
          id, title, summary, category_id,
          category:category_id(
            id, name,
            guide_type:user_guide_type!guide_type_id(id, name)
          )
        `)
        .eq('status', 'published')
        .or(`title.ilike.%${escaped}%,summary.ilike.%${escaped}%`)
        .order('title')
        .limit(30)

      if (error) throw error
      return data ?? []
    },
    enabled: trimmed.length > 0,
  })
}
