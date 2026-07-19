<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\SendMessageRequest;
use App\Http\Resources\School\ConversationResource;
use App\Http\Resources\School\MessageResource;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Http\Request;

class ConversationController extends Controller
{
    public function index(Request $request)
    {
        $authId = $request->user()->id;

        $conversations = Conversation::query()
            ->where(fn ($q) => $q->where('user_one_id', $authId)->orWhere('user_two_id', $authId))
            ->with(['userOne', 'userTwo', 'lastMessage'])
            ->withCount(['messages as unread_count' => fn ($q) => $q->where('sender_id', '!=', $authId)->whereNull('read_at')])
            ->orderByDesc('last_message_at')
            ->get();

        return ConversationResource::collection($conversations);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'recipient_id' => ['required', 'uuid', 'exists:users,id'],
        ]);

        $authId = $request->user()->id;
        abort_if($data['recipient_id'] === $authId, 422, 'Cannot start a conversation with yourself.');

        User::findOrFail($data['recipient_id']);

        $conversation = Conversation::between($authId, $data['recipient_id']);

        return new ConversationResource($conversation->load(['userOne', 'userTwo', 'lastMessage']));
    }

    public function messages(Request $request, Conversation $conversation)
    {
        $authId = $request->user()->id;
        abort_unless($conversation->isParticipant($authId), 403);

        $messages = $conversation->messages()
            ->with('sender')
            ->orderBy('created_at')
            ->paginate($request->integer('per_page', 50));

        $conversation->messages()
            ->where('sender_id', '!=', $authId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return MessageResource::collection($messages);
    }

    public function sendMessage(SendMessageRequest $request, Conversation $conversation)
    {
        $authId = $request->user()->id;
        abort_unless($conversation->isParticipant($authId), 403);

        $message = $conversation->messages()->create([
            'sender_id' => $authId,
            'body' => $request->validated('body'),
        ]);

        $conversation->update(['last_message_at' => $message->created_at]);

        return new MessageResource($message->load('sender'));
    }
}
