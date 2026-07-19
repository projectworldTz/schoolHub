<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\TransportRouteRequest;
use App\Http\Resources\School\TransportRouteResource;
use App\Models\TransportRoute;
use Illuminate\Http\Request;

class TransportRouteController extends Controller
{
    public function index()
    {
        $routes = TransportRoute::query()
            ->withCount('activeAssignments')
            ->orderBy('name')
            ->get();

        return TransportRouteResource::collection($routes);
    }

    public function store(TransportRouteRequest $request)
    {
        $route = TransportRoute::create($request->validated());

        return new TransportRouteResource($route->loadCount('activeAssignments'));
    }

    public function update(TransportRouteRequest $request, TransportRoute $transport_route)
    {
        $transport_route->update($request->validated());

        return new TransportRouteResource($transport_route->loadCount('activeAssignments'));
    }

    public function destroy(Request $request, TransportRoute $transport_route)
    {
        abort_unless($request->user()->can('transport.manage'), 403);

        $transport_route->delete();

        return response()->noContent();
    }
}
