/**
 * Game stars in the grown-up's account (Supabase table `game_progress`, one row per account,
 * readable and writable only by that account; see supabase/migrations).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { parseProgress, type Progress } from './progress'

const TABLE = 'game_progress'

/** The account's saved progress, or null if it has none yet. Throws if the request fails. */
export async function fetchCloudProgress(supabase: SupabaseClient, userId: string): Promise<Progress | null> {
  const { data, error } = await supabase.from(TABLE).select('progress').eq('user_id', userId).maybeSingle()
  if (error) throw error
  // Read it the same careful way as the browser copy, so a bad row can't break the game.
  return data ? parseProgress(JSON.stringify(data.progress)) : null
}

/** Replaces the account's saved progress. Throws if the request fails. */
export async function saveCloudProgress(supabase: SupabaseClient, userId: string, progress: Progress): Promise<void> {
  const { error } = await supabase.from(TABLE).upsert({ user_id: userId, progress, updated_at: new Date().toISOString() })
  if (error) throw error
}
