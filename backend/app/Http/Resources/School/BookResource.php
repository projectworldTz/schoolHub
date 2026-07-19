<?php

namespace App\Http\Resources\School;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Book */
class BookResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'author' => $this->author,
            'isbn' => $this->isbn,
            'category' => $this->category,
            'total_copies' => $this->total_copies,
            'available_copies' => $this->available_copies,
            'loans' => BookLoanResource::collection($this->whenLoaded('loans')),
        ];
    }
}
