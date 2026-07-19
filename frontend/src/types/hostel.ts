export type HostelRoomType = 'boys' | 'girls' | 'mixed'

export interface HostelRoom {
  id: string
  name: string
  type: HostelRoomType
  capacity: number
  occupied?: number
}

export type HostelAllocationStatus = 'active' | 'vacated'

export interface HostelAllocation {
  id: string
  student_id: string
  student_name?: string
  hostel_room_id: string
  room_name?: string
  academic_year_id: string
  academic_year_name?: string
  allocated_at: string | null
  vacated_at: string | null
  status: HostelAllocationStatus
}
