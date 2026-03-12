const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

/** Build full URL for a Supabase Edge Function */
export function fnUrl(name: string): string {
  return `${FUNCTIONS_URL}/${name}`;
}
