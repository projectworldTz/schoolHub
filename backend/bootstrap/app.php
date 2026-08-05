<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Middleware\RoleMiddleware;
use Spatie\Permission\Middleware\RoleOrPermissionMiddleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->statefulApi();

        // statefulApi() applies Sanctum's session/CSRF handling to every
        // route in routes/api.php based on the request's Origin (any
        // SANCTUM_STATEFUL_DOMAINS match), not on whether a session
        // actually exists — so an anonymous visitor's browser still gets
        // CSRF-checked. The public website's view-tracking beacon
        // (Public\WebsiteTrackingController) is a POST with no session to
        // protect and no XSRF cookie fetched (it's meant to work for
        // completely anonymous visitors), so it needs an explicit
        // exception or every beacon call 419s. Same reasoning would apply
        // to any future public POST endpoint under public/site/*.
        $middleware->validateCsrfTokens(except: [
            'api/public/site/*',
        ]);

        // Runs on every API request, after Sanctum's stateful/session setup.
        // See App\Http\Middleware\ResolveTenantFromUser and
        // App\Auth\TenantAwareUserProvider — the latter is what makes user
        // resolution work at all here, since User's BelongsToSchool scope
        // would otherwise block Laravel's own session/token lookups before
        // this middleware ever gets a chance to establish tenant context.
        $middleware->api(append: [
            \App\Http\Middleware\ResolveTenantFromUser::class,
        ]);

        // Laravel's middleware priority sorting pulls SubstituteBindings
        // (implicit route-model binding, e.g. {academicYear}) to run before
        // any unprioritized appended middleware — including
        // ResolveTenantFromUser. That breaks binding for any tenant-scoped
        // model, since BelongsToSchool's scope would apply with no tenant
        // set yet. Force the correct order explicitly.
        $middleware->prependToPriorityList(
            before: \Illuminate\Routing\Middleware\SubstituteBindings::class,
            prepend: \App\Http\Middleware\ResolveTenantFromUser::class,
        );

        $middleware->alias([
            'role' => RoleMiddleware::class,
            'permission' => PermissionMiddleware::class,
            'role_or_permission' => RoleOrPermissionMiddleware::class,
            'auth.token' => \App\Http\Middleware\EnsureApiTokenAuthenticated::class,
            'password.changed' => \App\Http\Middleware\EnsurePasswordHasBeenChanged::class,
            'website-builder.access' => \App\Http\Middleware\EnsureWebsiteBuilderAccess::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
