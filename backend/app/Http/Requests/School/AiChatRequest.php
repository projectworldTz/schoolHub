<?php

namespace App\Http\Requests\School;

use Illuminate\Foundation\Http\FormRequest;

class AiChatRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('ai-assistant.use');
    }

    public function rules(): array
    {
        return [
            // Capped at 20 turns / 4000 chars each — a generous chat, not
            // an unbounded one, since every request re-sends the whole
            // history to a paid external API.
            'messages' => ['required', 'array', 'min:1', 'max:20'],
            'messages.*.role' => ['required', 'in:user,assistant'],
            'messages.*.content' => ['required', 'string', 'max:4000'],
        ];
    }
}
