<?php

/**
 * Preset design-token catalog for the Website Builder public site. Not a
 * database table (see the module's plan doc) — there's nothing per-school
 * to store beyond which key a school picked (website_settings.theme_key)
 * and an optional primary_color override. Keys here are the only valid
 * values for theme_key; validated against this list in
 * WebsiteSettingsRequest.
 */

return [
    'modern' => [
        'label' => 'Modern',
        'font_heading' => 'Inter',
        'font_body' => 'Inter',
        'primary_color' => '#2563eb',
        'radius' => '1rem',
        'shadow' => 'soft',
    ],
    'minimal' => [
        'label' => 'Minimal',
        'font_heading' => 'Inter',
        'font_body' => 'Inter',
        'primary_color' => '#18181b',
        'radius' => '0.5rem',
        'shadow' => 'none',
    ],
    'classic' => [
        'label' => 'Classic',
        'font_heading' => 'Merriweather',
        'font_body' => 'Source Sans Pro',
        'primary_color' => '#7c2d12',
        'radius' => '0.375rem',
        'shadow' => 'soft',
    ],
    'international' => [
        'label' => 'International',
        'font_heading' => 'Poppins',
        'font_body' => 'Inter',
        'primary_color' => '#0ea5e9',
        'radius' => '0.75rem',
        'shadow' => 'soft',
    ],
    'luxury' => [
        'label' => 'Luxury',
        'font_heading' => 'Playfair Display',
        'font_body' => 'Lato',
        'primary_color' => '#a16207',
        'radius' => '0.25rem',
        'shadow' => 'strong',
    ],
    'children' => [
        'label' => 'Children School',
        'font_heading' => 'Baloo 2',
        'font_body' => 'Nunito',
        'primary_color' => '#f97316',
        'radius' => '1.5rem',
        'shadow' => 'soft',
    ],
    'dark' => [
        'label' => 'Dark',
        'font_heading' => 'Inter',
        'font_body' => 'Inter',
        'primary_color' => '#8b5cf6',
        'radius' => '1rem',
        'shadow' => 'strong',
        'dark' => true,
    ],
    'blue' => [
        'label' => 'Blue',
        'font_heading' => 'Inter',
        'font_body' => 'Inter',
        'primary_color' => '#1d4ed8',
        'radius' => '0.75rem',
        'shadow' => 'soft',
    ],
    'green' => [
        'label' => 'Green',
        'font_heading' => 'Inter',
        'font_body' => 'Inter',
        'primary_color' => '#15803d',
        'radius' => '0.75rem',
        'shadow' => 'soft',
    ],
];
