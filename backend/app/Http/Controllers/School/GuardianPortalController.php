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
 * Grants a guardian a login to the Parent Portal. Mirrors
 * GuardianImportService's bulk-import flow: the account gets an unguessable
 * random password (never shown to anyone) and the guardian is emailed an
 * activation link to set their own — rather than the admin being handed a
 * temporary password to relay by phone/WhatsApp, which was the previous,
 * error-prone behavior here.
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

        $user = DB::transaction(function () use ($guardian, $data) {
            $user = User::create([
                'school_id' => $guardian->school_id,
                'name' => $guardian->name,
                'email' => $data['email'],
                'password' => Hash::make(Str::random(40)),
                'is_active' => true,
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
            ],
        ]);
    }
}
