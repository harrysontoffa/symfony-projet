<?php

namespace App\Repository;

use App\Entity\Book;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Book>
 */
class BookRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Book::class);
    }
    public function findByTitle(string $title):array{
        return $this->createQueryBuilder('book')
        ->andWhere('book.title LIKE :title')
        ->setParameter('title', '%' . $title . '%')
        ->orderBy('book.id', 'ASC')
        ->setMaxResults(10)
        ->getQuery()
        ->getResult();

    }
    public function findPublishedAfter(\DateTimeInterface $date):array{
        return $this->createQueryBuilder('book')
        ->andWhere('book.publishedAt > :date')
        ->setParameter('date',  $date )
        ->orderBy('book.publishedAt', 'DESC')
        ->setMaxResults(10)
        ->getQuery()
        ->getResult();

    }


    /**
     * Les derniers livres ajoutés au catalogue.
     *
     * @return list<Book>
     */
    public function findLatest(int $limit): array
    {
        return $this->createQueryBuilder('book')
            ->orderBy('book.id', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    public function findByCategory(string $categoryName): array
    {
        return $this->createQueryBuilder('book')
            ->innerJoin('book.categories', 'category')
            ->andWhere('category.name = :categoryName')
            ->setParameter('categoryName', $categoryName)
            ->orderBy('book.id')
            ->getQuery()
            ->getResult();
    }
//    /**
//     * @return Book[] Returns an array of Book objects
//     */
//    public function findByExampleField($value): array
//    {
//        return $this->createQueryBuilder('b')
//            ->andWhere('b.exampleField = :val')
//            ->setParameter('val', $value)
//            ->orderBy('b.id', 'ASC')
//            ->setMaxResults(10)
//            ->getQuery()
//            ->getResult()
//        ;
//    }

//    public function findOneBySomeField($value): ?Book
//    {
//        return $this->createQueryBuilder('b')
//            ->andWhere('b.exampleField = :val')
//            ->setParameter('val', $value)
//            ->getQuery()
//            ->getOneOrNullResult()
//        ;
//    }
}
