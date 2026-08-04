<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Mail\AccountActivationMail;
use App\Models\Guardian;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Grants a guardian a login to the Parent Portal. Sends the same activation
 * email as GuardianImportService's bulk-import flow (a link to set their own
 * password) — but unlike that bulk flow, this one is triggered one guardian
 * at a time by an admin who's watching the result, so the generated
 * temporary password is also usable and returned once in the response: the
 * admin can log in as the parent themselves to verify access works, without
 * waiting on (or being blocked by) mail delivery. must_change_password is
 * set so that password can't just linger unrotated if it's ever used.
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
                'must_change_password' => true,
            ]);

            $user->assignRole('Parent');
            $guardian->update(['user_id' => $user->id, 'email' => $data['email']]);

            return $user;
        });

        $token = Password::broker()->createToken($user);
        Mail::to($user)->send(new AccountActivationMail(
            $user,
            $guardian->school,
            $token,
            "a parent/guardian at **{$guardian->school->name}**",
        ));

        return response()->json([
            'data' => [
                'user_id' => $user->id,
                'email' => $user->email,
                'temporary_password' => $temporaryPassword,
            ],
        ]);
    }
}
