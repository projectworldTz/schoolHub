<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\AddSchoolUserEmailRequest;
use App\Http\Requests\School\CreateSchoolUserRequest;
use App\Http\Requests\School\UpdateSchoolUserRequest;
use App\Http\Resources\UserResource;
use App\Mail\AccountActivationMail;
use App\Models\ActivityLog;
use App\Models\School;
use App\Models\User;
use App\Support\SchoolRoles;
use App\Support\Tenancy\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

class SchoolUserController extends Controller
{
    public function index(Request $request)
    {
        $users = User::query()
            ->with('roles')
            ->when($request->string('search')->isNotEmpty(), fn ($q) => $q->where('name', 'like', '%'.$request->string('search').'%'))
            ->when($request->string('role')->isNotEmpty(), function ($q) use ($request) {
                $role = $request->string('role');
                $q->whereHas('roles', fn ($q) => $q->where('name', $role));
            })
            ->orderBy('name')
            ->paginate($request->integer('per_page', 100));

        return UserResource::collection($users);
    }

    public function store(CreateSchoolUserRequest $request)
    {
        $data = $request->validated();
        $school = School::find(Tenant::id());
        $hasRealEmail = ! empty($data['email']);

        // No real email yet (a teacher who genuinely has none) — still
        // needs a real User row to hold a role and be assignable to
        // subjects/classes, so a placeholder address fills the unique
        // column instead of blocking account creation entirely. Shown once
        // in the response (never persisted in plaintext) so the admin can
        // hand it to the teacher directly, same as SchoolService::create()
        // does for a new school owner.
        $temporaryPassword = $hasRealEmail ? null : Str::password(12);

        $user = DB::transaction(function () use ($data, $hasRealEmail, $temporaryPassword) {
            $user = User::create([
                'school_id' => Tenant::id(),
                'name' => $data['name'],
                'email' => $hasRealEmail ? $data['email'] : User::placeholderEmailFor($data['name']),
                'phone' => $data['phone'] ?? null,
                'has_placeholder_email' => ! $hasRealEmail,
                // Real email: random, never-communicated password — the
                // activation email below is how they actually get in, same
                // as TeacherImportService/GuardianImportService. No email:
                // the temporary password above IS how they get in, so it's
                // set directly and must be changed on first login.
                'password' => Hash::make($hasRealEmail ? Str::random(40) : $temporaryPassword),
                'must_change_password' => ! $hasRealEmail,
                'is_active' => $data['is_active'] ?? true,
                'email_verified_at' => now(),
            ]);

            $user->syncRoles($data['roles']);

            return $user;
        });

        if ($hasRealEmail) {
            // Outside the transaction — a mail failure must not roll back
            // the user that was just successfully created.
            $token = Password::broker()->createToken($user);
            $roleLine = implode(', ', $data['roles']);
            Mail::to($user)->send(new AccountActivationMail($user, $school, $token, "a **{$roleLine}** at **{$school->name}**"));
        } else {
            // Not a real column — lives only on this in-memory instance so
            // UserResource can surface it in this one response.
            $user->temporary_password = $temporaryPassword;
        }

        return new UserResource($user->load('roles'));
    }

    /**
     * Upgrades a placeholder-email account to a real one once the teacher
     * actually has an email — sends the same activation mail store() sends
     * a brand-new user, since this is effectively their first real chance
     * to set their own password.
     */
    public function addEmail(AddSchoolUserEmailRequest $request, User $user)
    {
        $school = School::find(Tenant::id());

        $user->update([
            'email' => $request->validated('email'),
            'has_placeholder_email' => false,
        ]);

        $token = Password::broker()->createToken($user);
        $roleLine = implode(', ', $user->getRoleNames()->all());
        Mail::to($user)->send(new AccountActivationMail($user, $school, $token, "a **{$roleLine}** at **{$school->name}**"));

        return new UserResource($user->load('roles'));
    }

    public function show(User $user)
    {
        return new UserResource($user->load('roles'));
    }

    public function update(UpdateSchoolUserRequest $request, User $user)
    {
        $data = $request->validated();

        // Only the School Owner may deactivate the School Owner account —
        // everyone else (Manager included, even with users.manage) is
        // blocked here, matching the button being hidden in UsersPage.tsx.
        abort_if(
            ($data['is_active'] ?? true) === false
                && $user->hasRole('School Owner')
                && ! $request->user()->hasRole('School Owner'),
            403,
            'Only the School Owner can suspend the School Owner account.'
        );

        DB::transaction(function () use ($data, $user) {
            // A placeholder email is only ever meant to be replaced via
            // addEmail() (which also sends the activation mail), but if an
            // admin instead changes it through this general-purpose edit
            // form, the placeholder flag shouldn't be left stale either.
            // Compared against the current value (not just "was email
            // sent") because EditDetailsDialog always submits every field,
            // including an untouched email — that must NOT clear the flag.
            if (isset($data['email']) && $data['email'] !== $user->email) {
                $data['has_placeholder_email'] = false;
            }

            $user->update(collect($data)->except('roles')->all());

            if (isset($data['roles'])) {
                $oldRoles = $user->getRoleNames()->all();
                $user->syncRoles($data['roles']);

                // Spatie role assignment writes to the model_has_roles pivot
                // table, not a User column, so LogsActivity's update-diffing
                // (which only reacts to the User model's own attribute
                // changes) never sees it — logged explicitly here instead.
                if (collect($oldRoles)->sort()->values()->all() !== collect($data['roles'])->sort()->values()->all()) {
                    ActivityLog::create([
                        'school_id' => $user->school_id,
                        'user_id' => Auth::id(),
                        'subject_type' => User::class,
                        'subject_id' => $user->id,
                        'action' => 'updated',
                        'description' => "Roles updated for {$user->name} ({$user->email})",
                        'changes' => ['roles' => ['old' => $oldRoles, 'new' => $data['roles']]],
                    ]);
                }
            }
        });

        return new UserResource($user->load('roles'));
    }

    public function destroy(Request $request, User $user)
    {
        abort_unless($request->user()->can('users.manage'), 403);
        abort_if($user->is($request->user()), 422, 'You cannot remove your own account.');
        abort_if(
            $user->hasRole('School Owner') && ! $request->user()->hasRole('School Owner'),
            403,
            'Only the School Owner can remove the School Owner account.'
        );

        $user->delete();

        return response()->noContent();
    }

    public function availableRoles(Request $request)
    {
        abort_unless($request->user()->can('users.manage'), 403);

        $allowed = SchoolRoles::forType(School::find(Tenant::id())?->type);

        return response()->json([
            'data' => Role::query()->whereIn('name', $allowed)->orderBy('name')->pluck('name'),
        ]);
    }

    /**
     * Distinct role names actually held by at least one user in this
     * school — for the Users page's role filter. Deliberately not the same
     * list as availableRoles() above (the staff-assignable catalog for the
     * "New user" dialog, which intentionally excludes Student/Parent): a
     * filter should offer every role a real user might have, Student and
     * Parent included, since guardian-portal and student accounts are real
     * rows in this same table.
     */
    public function usedRoles(Request $request)
    {
        abort_unless($request->user()->can('users.manage'), 403);

        $roleNames = User::query()
            ->with('roles:id,name')
            ->get()
            ->pluck('roles')
            ->flatten()
            ->pluck('name')
            ->unique()
            ->sort()
            ->values();

        return response()->json(['data' => $roleNames]);
    }
}
