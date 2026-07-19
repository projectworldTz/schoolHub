export interface Conversation {
  id: string
  other_user_id: string
  other_user_name: string | null
  last_message: string | null
  last_message_at: string | null
  unread_count: number
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  sender_name?: string
  is_mine: boolean
  body: string
  read_at: string | null
  created_at: string
}
