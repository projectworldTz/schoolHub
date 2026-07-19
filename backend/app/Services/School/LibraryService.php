<?php

namespace App\Services\School;

use App\Models\Book;
use App\Models\BookLoan;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class LibraryService
{
    /**
     * available_copies is a denormalized counter tracking total_copies minus
     * outstanding loans; when total_copies changes we shift available_copies
     * by the same delta rather than letting the request overwrite it directly.
     */
    public function updateBook(Book $book, array $data): Book
    {
        if (array_key_exists('total_copies', $data) && (int) $data['total_copies'] !== $book->total_copies) {
            $delta = (int) $data['total_copies'] - $book->total_copies;
            $data['available_copies'] = max(0, $book->available_copies + $delta);
        }

        $book->update($data);

        return $book;
    }

    public function borrow(Book $book, array $data): BookLoan
    {
        return DB::transaction(function () use ($book, $data) {
            $book = Book::whereKey($book->id)->lockForUpdate()->first();

            if ($book->available_copies < 1) {
                throw ValidationException::withMessages([
                    'book_id' => 'No copies of this book are currently available.',
                ]);
            }

            $book->decrement('available_copies');

            return $book->loans()->create([
                'student_id' => $data['student_id'],
                'borrowed_at' => $data['borrowed_at'] ?? now(),
                'due_date' => $data['due_date'],
            ]);
        });
    }

    public function returnLoan(BookLoan $loan): BookLoan
    {
        return DB::transaction(function () use ($loan) {
            if ($loan->status === 'returned') {
                throw ValidationException::withMessages([
                    'status' => 'This loan has already been returned.',
                ]);
            }

            $loan->update(['returned_at' => now(), 'status' => 'returned']);
            $loan->book()->increment('available_copies');

            return $loan;
        });
    }
}
