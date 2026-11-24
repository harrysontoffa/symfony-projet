<?php

namespace App\Dto;
use App\Entity\Book;

final readonly class BookListDto
{
    public function __construct(
        public int $id,
        public string $title,
        public string $author,
        public \DateTimeInterface $publishAt,
    ) {}

    public static function fromEntity(Book $book):self{
        return new self (
            id: $book->getId(),
            title: $book->getTitle(),
            author: $book->getAuthor(),
            publishAt: $book->getPublishedAt(),
        );
    }

}
