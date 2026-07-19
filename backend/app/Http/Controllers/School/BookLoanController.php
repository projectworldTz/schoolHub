<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\BorrowBookRequest;
use App\Http\Resources\School\BookLoanResource;
use App\Models\Book;
use App\Models\BookLoan;
use App\Services\School\LibraryService;
use Illuminate\Http\Request;

class BookLoanController extends Controller
{
    public function __construct(protected LibraryService $libraryService) {}

    public function index(Request $request)
    {
        $loans = BookLoan::query()
            ->with(['book', 'student'])
            ->when($request->input('status'), fn ($q, $status) => $q->where('status', $status))
            ->when($request->input('student_id'), fn ($q, $id) => $q->where('student_id', $id))
            ->orderByDesc('borrowed_at')
            ->paginate($request->integer('per_page', 20));

        return BookLoanResource::collection($loans);
    }

    public function store(BorrowBookRequest $request, Book $book)
    {
        $loan = $this->libraryService->borrow($book, $request->validated());

        return new BookLoanResource($loan->load(['book', 'student']));
    }

    public function return(Request $request, BookLoan $loan)
    {
        abort_unless($request->user()->can('library.manage'), 403);

        $loan = $this->libraryService->returnLoan($loan);

        return new BookLoanResource($loan->load(['book', 'student']));
    }
}
