<?php

namespace App\Http\Resources\School;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Conversation */
class ConversationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $authId = $request->user()->id;
        $otherUser = $this->user_one_id === $authId ? $this->whenLoaded('userTwo') : $this->whenLoaded('userOne');

        return [
            'id' => $this->id,
            'other_user_id' => $this->otherUserId($authId),
            'other_user_name' => $otherUser?->name,
            'last_message' => $this->whenLoaded('lastMessage', fn () => $this->lastMessage?->body),
            'last_message_at' => $this->last_message_at?->toIso8601String(),
            'unread_count' => $this->when(isset($this->unread_count), fn () => (int) $this->unread_count),
        ];
    }
}
