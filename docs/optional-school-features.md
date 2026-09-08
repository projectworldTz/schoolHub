# Optional school features

Super Admin can select Fee Management, Library, Hostel, Transport, Cafeteria,
Clinic, and Inventory when registering a school. Open an existing school from
the Schools list to enable or disable each feature later. Check or uncheck
the feature boxes, then click the single Save button to apply all selections.
Checkbox changes remain a local draft until Save succeeds.

Existing schools keep facility modules enabled when the migration runs. The
existing Fee Management setting is preserved. Setup checkboxes start checked.
Disabling a feature changes only its school setting; existing module records
are retained for when access is enabled again.

The school navigation, quick actions, protected pages, report catalog, and
session/token API routes enforce the settings. School users cannot change
these settings. Active school sessions refresh their feature states every
30 seconds and on window focus; the API applies changes immediately.

Backend regression coverage: `SchoolFeatureAccessTest` and
`FeeManagementAccessTest`. Frontend coverage: `schoolFeatures.test.ts`,
`permissions.test.ts`, and `navigation.test.ts`.
