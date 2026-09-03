<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SessionController extends Controller
{
    public function index(Request $request)
    {
        abort_unless(config('session.driver') === 'database', 409, 'Session management requires the database session driver.');

        $currentId = $request->session()->getId();
        $sessions = DB::table(config('session.table', 'sessions'))
            ->where('user_id', $request->user()->id)
            ->orderByDesc('last_activity')
            ->get()
            ->map(fn ($session) => [
                'id' => $session->id,
                'ip_address' => $session->ip_address,
                'user_agent' => $session->user_agent,
                'last_active_at' => now()->setTimestamp($session->last_activity)->toIso8601String(),
                'is_current' => hash_equals($currentId, $session->id),
            ]);

        return response()->json(['data' => $sessions]);
    }

    public function destroy(Request $request, string $session)
    {
        abort_unless(config('session.driver') === 'database', 409, 'Session management requires the database session driver.');
        abort_if(hash_equals($request->session()->getId(), $session), 422, 'Use Sign out to end your current session.');

        $deleted = DB::table(config('session.table', 'sessions'))
            ->where('id', $session)
            ->where('user_id', $request->user()->id)
            ->delete();

        abort_unless($deleted === 1, 404);

        return response()->noContent();
    }
}
