<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\PromotionCommitRequest;
use App\Http\Resources\School\StudentPromotionResource;
use App\Models\StudentPromotion;
use App\Services\School\PromotionService;
use Illuminate\Http\Request;

class PromotionController extends Controller
{
    public function __construct(protected PromotionService $promotions) {}

    /**
     * Never writes — from_academic_year_id/to_academic_year_id default to
     * the previous/current academic year when omitted (see
     * PromotionService::preview()) but stay overridable, since a school
     * catching up on a missed year might need to preview a different pair.
     */
    public function preview(Request $request)
    {
        abort_unless($request->user()->can('graduation.manage'), 403);

        $result = $this->promotions->preview(
            $request->input('from_academic_year_id'),
            $request->input('to_academic_year_id')
        );

        return response()->json(['data' => $result]);
    }

    public function store(PromotionCommitRequest $request)
    {
        $data = $request->validated();

        $result = $this->promotions->commit(
            $data['from_academic_year_id'] ?? null,
            $data['to_academic_year_id'],
            $data['decisions'],
            $data['mode'],
            $request->user()
        );

        return response()->json(['data' => $result]);
    }

    public function history(Request $request)
    {
        abort_unless($request->user()->can('graduation.manage'), 403);

        $promotions = StudentPromotion::query()
            ->with(['student', 'fromSchoolClass', 'toSchoolClass', 'fromAcademicYear', 'toAcademicYear', 'promotedBy'])
            ->when($request->input('student_id'), fn ($q, $id) => $q->where('student_id', $id))
            ->orderByDesc('promoted_at')
            ->paginate($request->integer('per_page', 20));

        return StudentPromotionResource::collection($promotions);
    }
}
