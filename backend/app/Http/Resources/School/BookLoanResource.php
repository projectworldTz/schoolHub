<?php

namespace App\Http\Resources\School;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\BookLoan */
class BookLoanResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'book_id' => $this->book_id,
            'book_title' => $this->whenLoaded('book', fn () => $this->book->title),
            'student_id' => $this->student_id,
            'student_name' => $this->whenLoaded('student', fn () => $this->student->full_name),
            'borrowed_at' => $this->borrowed_at?->toDateString(),
            'due_date' => $this->due_date?->toDateString(),
            'returned_at' => $this->returned_at?->toDateString(),
            'status' => $this->status,
        ];
    }
}
