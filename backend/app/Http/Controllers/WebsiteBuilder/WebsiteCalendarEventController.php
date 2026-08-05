<?php

namespace App\Http\Controllers\WebsiteBuilder;

use App\Http\Controllers\Controller;
use App\Http\Requests\WebsiteBuilder\WebsiteCalendarEventRequest;
use App\Http\Resources\WebsiteBuilder\WebsiteCalendarEventResource;
use App\Models\WebsiteCalendarEvent;

class WebsiteCalendarEventController extends Controller
{
    public function index()
    {
        return WebsiteCalendarEventResource::collection(WebsiteCalendarEvent::orderBy('start_date')->get());
    }

    public function store(WebsiteCalendarEventRequest $request)
    {
        return new WebsiteCalendarEventResource(WebsiteCalendarEvent::create($request->validated()));
    }

    public function update(WebsiteCalendarEventRequest $request, WebsiteCalendarEvent $calendar_event)
    {
        $calendar_event->update($request->validated());

        return new WebsiteCalendarEventResource($calendar_event);
    }

    public function destroy(WebsiteCalendarEvent $calendar_event)
    {
        $calendar_event->delete();

        return response()->noContent();
    }
}
