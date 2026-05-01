/** Supabase Storage bucket for manual images. Create it in Dashboard → Storage or run `supabase/storage-manual-media.sql`. */
export const MANUAL_MEDIA_BUCKET =
  import.meta.env.VITE_SUPABASE_MANUAL_MEDIA_BUCKET || 'manual-media'
