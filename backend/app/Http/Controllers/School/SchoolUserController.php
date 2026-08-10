<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\CreateSchoolUserRequest;
use App\Http\Requests\School\UpdateSchoolUserRequest;
use App\Http\Resources\UserResource;
use App\Models\ActivityLog;
use App\Models\School;
use App\Models\User;
use App\Support\SchoolRoles;
use App\Support\Tenancy\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
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

        $user = DB::transaction(function () use ($data, $request) {
            $user = User::create([
                'school_id' => Tenant::id(),
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'is_active' => $data['is_active'] ?? true,
                'email_verified_at' => now(),
            ]);

            $user->syncRoles($data['roles']);

            return $user;
        });

        return new UserResource($user->load('roles'));
    }

    public function show(User $user)
    {
        return new UserResource($user->load('roles'));
    }

    public function update(UpdateSchoolUserRequest $request, User $user)
    {
        $data = $request->validated();

        DB::transaction(function () use ($data, $user) {
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
