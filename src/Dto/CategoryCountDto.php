<?php

namespace App\Dto;

/**
 * Une catégorie et le nombre de livres qu'elle contient (chapitre « Le large » de l'accueil).
 */
final readonly class CategoryCountDto
{
    public function __construct(
        public string $name,
        public int $bookCount,
    ) {
    }
}
