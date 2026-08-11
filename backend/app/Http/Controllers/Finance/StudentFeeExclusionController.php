<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Http\Requests\Finance\StudentFeeExclusionRequest;
use App\Http\Requests\Finance\UpdateStudentFeeExclusionRequest;
use App\Http\Resources\Finance\StudentFeeExclusionResource;
use App\Models\AcademicYear;
use App\Models\FeeCategory;
use App\Models\Student;
use App\Models\StudentFeeExclusion;
use App\Services\Finance\FeeExclusionService;
use Illuminate\Http\Request;

class StudentFeeExclusionController extends Controller
{
    public function __construct(protected FeeExclusionService $feeExclusionService) {}

    public function index(Request $request, Student $student)
    {
        abort_unless($request->user()->can('finance.manage'), 403);

        $exclusions = $student->feeExclusions()
            ->when($request->input('academic_year_id'), fn ($q, $yearId) => $q->where('academic_year_id', $yearId))
            ->with(['feeCategory', 'academicYear', 'excludedBy'])
            ->orderByDesc('created_at')
            ->get();

        return StudentFeeExclusionResource::collection($exclusions);
    }

    public function store(StudentFeeExclusionRequest $request, Student $student)
    {
        $data = $request->validated();

        $feeCategory = FeeCategory::findOrFail($data['fee_category_id']);
        $academicYear = AcademicYear::findOrFail($data['academic_year_id']);

        $result = $this->feeExclusionService->exclude(
            $student,
            $feeCategory,
            $academicYear,
            $data['reason'] ?? null,
            $request->user()->id
        );

        return response()->json([
            'data' => (new StudentFeeExclusionResource($result['exclusion']->load(['feeCategory', 'academicYear', 'excludedBy'])))->resolve(),
            'adjusted_invoices' => $result['adjusted_invoices'],
        ], 201);
    }

    /**
     * Only the reason is editable — fee_category_id/academic_year_id are
     * what the invoice recalculation in exclude() keyed off of, so changing
     * either here would leave already-adjusted invoices reflecting a
     * category this record no longer points at. Swapping category/year
     * means deleting this exclusion and creating a new one instead.
     */
    public function update(UpdateStudentFeeExclusionRequest $request, Student $student, StudentFeeExclusion $fee_exclusion)
    {
        abort_unless($fee_exclusion->student_id === $student->id, 404);

        $fee_exclusion->update($request->validated());

        return response()->json([
            'data' => (new StudentFeeExclusionResource($fee_exclusion->load(['feeCategory', 'academicYear', 'excludedBy'])))->resolve(),
        ]);
    }

    public function destroy(Request $request, Student $student, StudentFeeExclusion $fee_exclusion)
    {
        abort_unless($request->user()->can('finance.manage'), 403);
        abort_unless($fee_exclusion->student_id === $student->id, 404);

        $this->feeExclusionService->include($fee_exclusion);

        return response()->noContent();
    }
}
