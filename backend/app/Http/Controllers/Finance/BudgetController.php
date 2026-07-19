<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Http\Requests\Finance\BudgetRequest;
use App\Http\Resources\Finance\BudgetResource;
use App\Models\Budget;
use Illuminate\Http\Request;

class BudgetController extends Controller
{
    public function index(Request $request)
    {
        $budgets = Budget::query()
            ->with(['expenseCategory', 'academicYear'])
            ->when($request->input('academic_year_id'), fn ($q, $id) => $q->where('academic_year_id', $id))
            ->get();

        return BudgetResource::collection($budgets);
    }

    public function store(BudgetRequest $request)
    {
        $budget = Budget::create($request->validated());

        return new BudgetResource($budget->load(['expenseCategory', 'academicYear']));
    }

    public function update(BudgetRequest $request, Budget $budget)
    {
        $budget->update($request->validated());

        return new BudgetResource($budget->load(['expenseCategory', 'academicYear']));
    }

    public function destroy(Request $request, Budget $budget)
    {
        abort_unless($request->user()->can('expenses.manage'), 403);

        $budget->delete();

        return response()->noContent();
    }
}
