<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\CafeteriaMenuRequest;
use App\Http\Resources\School\CafeteriaMenuResource;
use App\Models\CafeteriaMenu;
use Illuminate\Http\Request;

class CafeteriaMenuController extends Controller
{
    public function index(Request $request)
    {
        $menus = CafeteriaMenu::query()
            ->when($request->input('from'), fn ($q, $from) => $q->where('menu_date', '>=', $from))
            ->when($request->input('to'), fn ($q, $to) => $q->where('menu_date', '<=', $to))
            ->orderBy('menu_date')
            ->get();

        return CafeteriaMenuResource::collection($menus);
    }

    public function store(CafeteriaMenuRequest $request)
    {
        $menu = CafeteriaMenu::create($request->validated());

        return new CafeteriaMenuResource($menu);
    }

    public function update(CafeteriaMenuRequest $request, CafeteriaMenu $cafeteria_menu)
    {
        $cafeteria_menu->update($request->validated());

        return new CafeteriaMenuResource($cafeteria_menu);
    }

    public function destroy(Request $request, CafeteriaMenu $cafeteria_menu)
    {
        abort_unless($request->user()->can('cafeteria.manage'), 403);

        $cafeteria_menu->delete();

        return response()->noContent();
    }
}
