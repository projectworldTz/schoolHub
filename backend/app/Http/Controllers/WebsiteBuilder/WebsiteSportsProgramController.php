<?php

namespace App\Http\Controllers\WebsiteBuilder;

use App\Http\Controllers\Controller;
use App\Http\Requests\WebsiteBuilder\WebsiteSportsProgramRequest;
use App\Http\Resources\WebsiteBuilder\WebsiteSportsProgramResource;
use App\Models\WebsiteSportsProgram;

class WebsiteSportsProgramController extends Controller
{
    public function index()
    {
        return WebsiteSportsProgramResource::collection(WebsiteSportsProgram::orderBy('sort_order')->get());
    }

    public function store(WebsiteSportsProgramRequest $request)
    {
        return new WebsiteSportsProgramResource(WebsiteSportsProgram::create($request->validated()));
    }

    public function update(WebsiteSportsProgramRequest $request, WebsiteSportsProgram $sportsProgram)
    {
        $sportsProgram->update($request->validated());

        return new WebsiteSportsProgramResource($sportsProgram);
    }

    public function destroy(WebsiteSportsProgram $sportsProgram)
    {
        $sportsProgram->delete();

        return response()->noContent();
    }
}
