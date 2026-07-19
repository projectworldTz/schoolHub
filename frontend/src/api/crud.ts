import { apiClient } from '@/api/client'

/**
 * Every /school/{resource} endpoint (branches, departments, subjects, ...)
 * follows the identical { data: T[] } list / { data: T } item shape, so a
 * single factory replaces ~7 near-duplicate API modules.
 */
export function createCrudApi<T, TPayload = Partial<T>>(resource: string) {
  return {
    list: async (): Promise<T[]> => {
      const { data } = await apiClient.get<{ data: T[] }>(`/school/${resource}`)
      return data.data
    },
    create: async (payload: TPayload): Promise<T> => {
      const { data } = await apiClient.post<{ data: T }>(`/school/${resource}`, payload)
      return data.data
    },
    update: async (id: string, payload: TPayload): Promise<T> => {
      const { data } = await apiClient.put<{ data: T }>(`/school/${resource}/${id}`, payload)
      return data.data
    },
    remove: async (id: string): Promise<void> => {
      await apiClient.delete(`/school/${resource}/${id}`)
    },
  }
}
