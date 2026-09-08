export const SCHOOL_FEATURES = [
  { key: 'fee_management', field: 'fee_management_enabled', label: 'Fee Management', description: 'Fee structures, invoices, payments, and reports.', permission: 'finance.manage' },
  { key: 'library', field: 'library_enabled', label: 'Library', description: 'Books, borrowing, and library reports.', permission: 'library.manage' },
  { key: 'hostel', field: 'hostel_enabled', label: 'Hostel', description: 'Rooms, student allocations, and occupancy reports.', permission: 'hostel.manage' },
  { key: 'transport', field: 'transport_enabled', label: 'Transport', description: 'Routes, student assignments, and transport reports.', permission: 'transport.manage' },
  { key: 'cafeteria', field: 'cafeteria_enabled', label: 'Cafeteria', description: 'Meal menus and cafeteria management.', permission: 'cafeteria.manage' },
  { key: 'clinic', field: 'clinic_enabled', label: 'Clinic', description: 'Student visits and clinic reports.', permission: 'clinic.manage' },
  { key: 'inventory', field: 'inventory_enabled', label: 'Inventory', description: 'Stock items, transactions, and inventory reports.', permission: 'inventory.manage' },
] as const

export type SchoolFeature = typeof SCHOOL_FEATURES[number]['key']
export type SchoolFeatureField = typeof SCHOOL_FEATURES[number]['field']
export type SchoolFeatureSettings = Record<SchoolFeatureField, boolean>

export function featureForPath(path: string) {
  const normalized = path.replace(/\/+$/, '')
  if (/^\/app\/(finance|invoices)(\/|$)/.test(normalized) ||
      /^\/parent\/students\/[^/]+\/invoices\//.test(normalized)) return SCHOOL_FEATURES[0]
  const reportFeatures: Record<string, SchoolFeature> = {
    'fee-collection': 'fee_management', 'library-loans': 'library',
    'hostel-occupancy': 'hostel', 'transport-roster': 'transport',
    'inventory-stock': 'inventory', 'clinic-visits': 'clinic',
  }
  const report = normalized.match(/^\/app\/reports\/([^/]+)$/)?.[1]
  return SCHOOL_FEATURES.find((feature) =>
    (feature.key !== 'fee_management' && (normalized === `/app/${feature.key}` || normalized.startsWith(`/app/${feature.key}/`))) ||
    (report && reportFeatures[report] === feature.key)
  )
}
