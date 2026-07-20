<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\CreateSchoolUserRequest;
use App\Http\Requests\School\UpdateSchoolUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Support\SchoolRoles;
use Illuminate\Http\Request;
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
            ->orderBy('name')
            ->paginate($request->integer('per_page', 20));

        return UserResource::collection($users);
    }

    public function store(CreateSchoolUserRequest $request)
    {
        $data = $request->validated();

        $user = DB::transaction(function () use ($data, $request) {
            $user = User::create([
                'school_id' => $request->user()->school_id,
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
                $user->syncRoles($data['roles']);
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

        $allowed = SchoolRoles::forType($request->user()->school?->type);

        return response()->json([
            'data' => Role::query()->whereIn('name', $allowed)->orderBy('name')->pluck('name'),
        ]);
    }
}
