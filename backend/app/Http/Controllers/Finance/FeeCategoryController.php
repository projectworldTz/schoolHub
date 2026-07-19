<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Http\Requests\Finance\FeeCategoryRequest;
use App\Http\Resources\Finance\FeeCategoryResource;
use App\Models\FeeCategory;
use Illuminate\Http\Request;

class FeeCategoryController extends Controller
{
    public function index()
    {
        return FeeCategoryResource::collection(FeeCategory::query()->orderBy('name')->get());
    }

    public function store(FeeCategoryRequest $request)
    {
        $category = FeeCategory::create($request->validated());

        return new FeeCategoryResource($category);
    }

    public function update(FeeCategoryRequest $request, FeeCategory $fee_category)
    {
        $fee_category->update($request->validated());

        return new FeeCategoryResource($fee_category);
    }

    public function destroy(Request $request, FeeCategory $fee_category)
    {
        abort_unless($request->user()->can('finance.manage'), 403);

        $fee_category->delete();

        return response()->noContent();
    }
}
