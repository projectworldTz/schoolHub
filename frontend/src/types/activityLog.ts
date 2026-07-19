export type ActivityLogAction = 'created' | 'updated' | 'deleted'

export interface ActivityLogChange {
  old: unknown
  new: unknown
}

export interface ActivityLogEntry {
  id: string
  subject_type: string
  subject_id: string
  action: ActivityLogAction
  description: string
  changes: Record<string, ActivityLogChange> | null
  user_name?: string
  created_at: string
}
