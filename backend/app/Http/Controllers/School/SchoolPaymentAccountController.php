<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\SchoolPaymentAccountRequest;
use App\Http\Resources\School\SchoolPaymentAccountResource;
use App\Models\SchoolPaymentAccount;
use Illuminate\Http\Request;

/**
 * index() is deliberately open to any authenticated tenant user (no
 * permission gate) — parents need to read this list on their dashboard to
 * know where to send fee payments, same "read open, write gated" pattern
 * as FeeCategoryController.
 */
class SchoolPaymentAccountController extends Controller
{
    public function index()
    {
        return SchoolPaymentAccountResource::collection(
            SchoolPaymentAccount::query()->orderBy('currency')->orderBy('account_name')->get()
        );
    }

    public function store(SchoolPaymentAccountRequest $request)
    {
        $account = SchoolPaymentAccount::create($request->validated());

        return new SchoolPaymentAccountResource($account);
    }

    public function update(SchoolPaymentAccountRequest $request, SchoolPaymentAccount $payment_account)
    {
        $payment_account->update($request->validated());

        return new SchoolPaymentAccountResource($payment_account);
    }

    public function destroy(Request $request, SchoolPaymentAccount $payment_account)
    {
        abort_unless($request->user()->can('school-settings.manage'), 403);

        $payment_account->delete();

        return response()->noContent();
    }
}
