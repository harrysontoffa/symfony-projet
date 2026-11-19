<?php
namespace App\Service;

use App\Repository\BookRepository;
use App\Entity\Book;

class BookService {
    public function __construct(private BookRepository $bookRepository){}
    public function getBooks():array{
        return $this->bookRepository->findAll() ?? [];
    }
    public function getBookById(int $id):?Book {
       return  $this->bookRepository->find($id);
    }
}
