<?php

namespace App\Dto;

final readonly class BookListDto
{
    public function __construct(
        public int $id,
        public string $title,
        public string $author,
        public \DateTimeInterface $publishAt,
    ) {}

}
