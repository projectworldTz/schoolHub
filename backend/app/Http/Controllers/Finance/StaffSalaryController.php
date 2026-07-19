<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Http\Requests\Finance\StaffSalaryRequest;
use App\Http\Resources\Finance\StaffSalaryResource;
use App\Models\StaffSalary;
use Illuminate\Http\Request;

class StaffSalaryController extends Controller
{
    public function index()
    {
        return StaffSalaryResource::collection(
            StaffSalary::query()->with('user')->orderBy('created_at')->get()
        );
    }

    public function store(StaffSalaryRequest $request)
    {
        $salary = StaffSalary::create($request->validated());

        return new StaffSalaryResource($salary->load('user'));
    }

    public function update(StaffSalaryRequest $request, StaffSalary $staff_salary)
    {
        $staff_salary->update($request->validated());

        return new StaffSalaryResource($staff_salary->load('user'));
    }

    public function destroy(Request $request, StaffSalary $staff_salary)
    {
        abort_unless($request->user()->can('payroll.manage'), 403);

        $staff_salary->delete();

        return response()->noContent();
    }
}
