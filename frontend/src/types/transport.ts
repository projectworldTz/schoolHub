export interface TransportRoute {
  id: string
  name: string
  vehicle_registration: string | null
  driver_name: string | null
  driver_phone: string | null
  capacity: number | null
  assigned?: number
}

export type TransportAssignmentStatus = 'active' | 'inactive'

export interface TransportAssignment {
  id: string
  student_id: string
  student_name?: string
  transport_route_id: string
  route_name?: string
  academic_year_id: string
  academic_year_name?: string
  pickup_point: string | null
  status: TransportAssignmentStatus
}
