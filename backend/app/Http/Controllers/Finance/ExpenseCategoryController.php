<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Http\Requests\Finance\ExpenseCategoryRequest;
use App\Http\Resources\Finance\ExpenseCategoryResource;
use App\Models\ExpenseCategory;
use Illuminate\Http\Request;

class ExpenseCategoryController extends Controller
{
    public function index()
    {
        return ExpenseCategoryResource::collection(ExpenseCategory::query()->orderBy('name')->get());
    }

    public function store(ExpenseCategoryRequest $request)
    {
        $category = ExpenseCategory::create($request->validated());

        return new ExpenseCategoryResource($category);
    }

    public function update(ExpenseCategoryRequest $request, ExpenseCategory $expense_category)
    {
        $expense_category->update($request->validated());

        return new ExpenseCategoryResource($expense_category);
    }

    public function destroy(Request $request, ExpenseCategory $expense_category)
    {
        abort_unless($request->user()->can('expenses.manage'), 403);

        $expense_category->delete();

        return response()->noContent();
    }
}
