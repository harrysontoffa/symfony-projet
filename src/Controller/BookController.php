<?php

namespace App\Controller;

use App\Repository\BookRepository;
use App\Service\BookService;
use PhpParser\Node\Stmt\TryCatch;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;


class BookController extends AbstractController {
    private BookService $bookService;
    private BookRepository $book_repository;
    public function __construct(BookService $bookService , BookRepository $book_repository){
        $this->bookService=$bookService;
        $this->book_repository=$book_repository;
    }
    #[Route('/books', name: 'app_books')]
    public function showAllUser():Response{
        $books= $this->bookService->getBooks();
        return $this->render('book/show_all_book.html.twig', ['books'=>$books]);
    }
    #[Route('/book/{id}', name:'app_book_detaille', requirements: ['id'=>'\d+'])]
    public function showBookById(int $id):Response{
        $book=$this->bookService->getBookById($id);

        return $this->render('book/show_book_id.html.twig', ['book'=>$book]);
    }
    #[Route ('/search/byTitle/{title}', name:'app_book_search_by_title',methods:['GET'])]
    public function GetBookByTitle(string $title):Response{

    $book = $this->book_repository->findByTitle($title);

    return $this->render('book/show_by_title.html.twig', ['book'=>$book]);

    }
    #[Route ('/search/byDate/{date}', name:'app_book_search_by_date', requirements: ['date' => '\d{4}-\d{2}-\d{2}'], methods:['GET'])]
    public function GetBookByDate(string $date):Response{
        try {
            $dateTime = new \DateTimeImmutable($date);
        } catch(\Exception) {
            throw $this->createNotFoundException('Format de date unvalide');

        }

    $book = $this->book_repository->findPublishedAfter($dateTime);

    return $this->render('book/show_by_date.html.twig', ['book'=>$book, 'date'=>$dateTime]);

    }
    #[Route('/search/category/{categoryName}', name: 'app_book_by_category', methods: ['GET'])]
    public function GetBookByCategory(string $categoryName): Response
    {
        $books = $this->book_repository->findByCategory($categoryName);

        return $this->render('book/show_by_category.html.twig', ['books' => $books, 'categoryName' => $categoryName]);
    }
}
