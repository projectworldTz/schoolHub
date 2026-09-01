@php($schoolLogo = app(\App\Services\School\SchoolBrandingService::class)->pdfDataUri($school))
@if($schoolLogo)
    <img src="{{ $schoolLogo }}" alt="" style="display: block; width: auto; height: auto; max-width: 90px; max-height: 70px; margin: 0 auto 8px; object-fit: contain;">
@endif
