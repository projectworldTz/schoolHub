<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\Guardian;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Grants a guardian a login to the Parent Portal. There's no email/SMS
 * provider wired up yet (same gap noted for announcements in Phase 3), so
 * the generated password is returned once in the response for the admin to
 * relay to the parent directly, rather than "sent" anywhere.
 */
class GuardianPortalController extends Controller
{
    public function store(Request $request, Guardian $guardian)
    {
        abort_unless($request->user()->can('students.manage'), 403);

        if ($guardian->user_id) {
            throw ValidationException::withMessages(['guardian' => 'This guardian already has portal access.']);
        }

        $data = $request->validate([
            'email' => [
                'required', 'email',
                Rule::unique('users', 'email'),
            ],
        ]);

        $temporaryPassword = Str::password(12);

        $user = DB::transaction(function () use ($guardian, $data, $temporaryPassword) {
            $user = User::create([
                'school_id' => $guardian->school_id,
                'name' => $guardian->name,
                'email' => $data['email'],
                'password' => Hash::make($temporaryPassword),
                'is_active' => true,
            ]);

            $user->assignRole('Parent');
            $guardian->update(['user_id' => $user->id, 'email' => $data['email']]);

            return $user;
        });

        return response()->json([
            'data' => [
                'user_id' => $user->id,
                'email' => $user->email,
                'temporary_password' => $temporaryPassword,
            ],
        ]);
    }
}
