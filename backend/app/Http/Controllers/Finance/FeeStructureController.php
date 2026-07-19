<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Http\Requests\Finance\FeeStructureRequest;
use App\Http\Resources\Finance\FeeStructureResource;
use App\Models\FeeStructure;
use Illuminate\Http\Request;

class FeeStructureController extends Controller
{
    protected const WITH = ['academicYear', 'term', 'schoolClass', 'feeCategory'];

    public function index(Request $request)
    {
        $structures = FeeStructure::query()
            ->with(self::WITH)
            ->when($request->input('academic_year_id'), fn ($q, $id) => $q->where('academic_year_id', $id))
            ->orderByDesc('created_at')
            ->get();

        return FeeStructureResource::collection($structures);
    }

    public function store(FeeStructureRequest $request)
    {
        $structure = FeeStructure::create($request->validated());

        return new FeeStructureResource($structure->load(self::WITH));
    }

    public function update(FeeStructureRequest $request, FeeStructure $fee_structure)
    {
        $fee_structure->update($request->validated());

        return new FeeStructureResource($fee_structure->load(self::WITH));
    }

    public function destroy(Request $request, FeeStructure $fee_structure)
    {
        abort_unless($request->user()->can('finance.manage'), 403);

        $fee_structure->delete();

        return response()->noContent();
    }
}
