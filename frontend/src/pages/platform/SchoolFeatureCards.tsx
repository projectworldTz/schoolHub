import { useState } from 'react'
import { toast } from 'sonner'
import { SCHOOL_FEATURES, type SchoolFeatureSettings } from '@/config/schoolFeatures'
import { useSetSchoolFeatures } from '@/hooks/useSchools'
import type { School } from '@/types/school'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

export function SchoolFeatureCards({ school }: { school: School }) {
  const update = useSetSchoolFeatures()
  const [draft, setDraft] = useState<Partial<SchoolFeatureSettings>>({})
  const settings = Object.fromEntries(SCHOOL_FEATURES.map(({ field }) => [field, draft[field] ?? school[field]])) as SchoolFeatureSettings
  const dirty = SCHOOL_FEATURES.some(({ field }) => settings[field] !== school[field])

  return <Card className="lg:col-span-3">
    <CardHeader>
      <CardTitle>School features</CardTitle>
      <CardDescription>Check a box to enable a feature, or uncheck it to disable it. Click Save to apply your changes. Existing records are preserved.</CardDescription>
    </CardHeader>
    <CardContent>
      <form className="space-y-5" onSubmit={(event) => {
        event.preventDefault()
        if (!dirty || update.isPending) return
        update.mutate({ id: school.id, settings }, {
          onSuccess: () => { setDraft({}); toast.success('School features saved') },
          onError: () => toast.error('Could not save school features. Please try again.'),
        })
      }}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SCHOOL_FEATURES.map((feature) => <label key={feature.key} className="flex cursor-pointer items-start gap-3 rounded-lg border p-4">
            <Checkbox className="mt-0.5" checked={settings[feature.field]} disabled={update.isPending}
              onCheckedChange={(checked) => setDraft((current) => ({ ...current, [feature.field]: checked === true }))}
              aria-label={feature.label} />
            <span className="min-w-0"><span className="block text-sm font-medium">{feature.label}</span>
              <span className="block text-sm text-muted-foreground">{feature.description}</span></span>
          </label>)}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={!dirty || update.isPending}>{update.isPending ? 'Saving...' : 'Save'}</Button>
          {dirty && <span className="text-sm text-muted-foreground" role="status">Unsaved changes</span>}
        </div>
      </form>
    </CardContent>
  </Card>
}
