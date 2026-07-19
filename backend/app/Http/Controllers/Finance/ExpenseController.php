<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Http\Requests\Finance\ExpenseRequest;
use App\Http\Resources\Finance\ExpenseResource;
use App\Models\Expense;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    public function index(Request $request)
    {
        $expenses = Expense::query()
            ->with(['category', 'recordedBy'])
            ->when($request->input('expense_category_id'), fn ($q, $id) => $q->where('expense_category_id', $id))
            ->orderByDesc('expense_date')
            ->get();

        return ExpenseResource::collection($expenses);
    }

    public function store(ExpenseRequest $request)
    {
        $expense = Expense::create([...$request->validated(), 'recorded_by' => $request->user()->id]);

        return new ExpenseResource($expense->load(['category', 'recordedBy']));
    }

    public function update(ExpenseRequest $request, Expense $expense)
    {
        $expense->update($request->validated());

        return new ExpenseResource($expense->load(['category', 'recordedBy']));
    }

    public function destroy(Request $request, Expense $expense)
    {
        abort_unless($request->user()->can('expenses.manage'), 403);

        $expense->delete();

        return response()->noContent();
    }
}
