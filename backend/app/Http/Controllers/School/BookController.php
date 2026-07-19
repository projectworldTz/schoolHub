<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\BookRequest;
use App\Http\Resources\School\BookResource;
use App\Models\Book;
use App\Services\School\LibraryService;
use Illuminate\Http\Request;

class BookController extends Controller
{
    public function __construct(protected LibraryService $libraryService) {}

    public function index(Request $request)
    {
        $books = Book::query()
            ->when($request->input('search'), fn ($q, $search) => $q->where('title', 'like', "%{$search}%"))
            ->orderBy('title')
            ->paginate($request->integer('per_page', 20));

        return BookResource::collection($books);
    }

    public function store(BookRequest $request)
    {
        $data = $request->validated();
        $data['available_copies'] = $data['total_copies'];

        $book = Book::create($data);

        return new BookResource($book);
    }

    public function show(Book $book)
    {
        return new BookResource($book->load(['loans.student']));
    }

    public function update(BookRequest $request, Book $book)
    {
        $book = $this->libraryService->updateBook($book, $request->validated());

        return new BookResource($book);
    }

    public function destroy(Request $request, Book $book)
    {
        abort_unless($request->user()->can('library.manage'), 403);

        $book->delete();

        return response()->noContent();
    }
}
