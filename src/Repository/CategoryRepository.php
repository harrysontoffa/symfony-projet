<?php

namespace App\Repository;

use App\Dto\CategoryCountDto;
use App\Entity\Category;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Doctrine\ORM\EntityManagerInterface;


/**
 * @extends ServiceEntityRepository<Category>
 */
class CategoryRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Category::class);
    }

    /**
     * Catégories qui contiennent au moins un livre, avec leur nombre de livres.
     *
     * Regroupées par nom, comme la recherche /search/category/{categoryName} :
     * deux catégories homonymes ne forment qu'un seul rivage.
     *
     * @return list<CategoryCountDto>
     */
    public function findNonEmptyWithBookCount(): array
    {
        $rows = $this->createQueryBuilder('category')
            ->select('category.name AS name', 'COUNT(DISTINCT book.id) AS bookCount')
            ->innerJoin('category.books', 'book')
            ->groupBy('category.name')
            ->orderBy('bookCount', 'DESC')
            ->addOrderBy('category.name', 'ASC')
            ->getQuery()
            ->getArrayResult();

        return array_map(
            static fn (array $row): CategoryCountDto => new CategoryCountDto($row['name'], (int) $row['bookCount']),
            $rows,
        );
    }
    // src/Repository/CategoryRepository.php
public function save(Category $category, bool $flush = true): void
{
    $this->getEntityManager()->persist($category);

    if ($flush) {
        $this->getEntityManager()->flush();
    }
}


//    /**
//     * @return Category[] Returns an array of Category objects
//     */
//    public function findByExampleField($value): array
//    {
//        return $this->createQueryBuilder('c')
//            ->andWhere('c.exampleField = :val')
//            ->setParameter('val', $value)
//            ->orderBy('c.id', 'ASC')
//            ->setMaxResults(10)
//            ->getQuery()
//            ->getResult()
//        ;
//    }

//    public function findOneBySomeField($value): ?Category
//    {
//        return $this->createQueryBuilder('c')
//            ->andWhere('c.exampleField = :val')
//            ->setParameter('val', $value)
//            ->getQuery()
//            ->getOneOrNullResult()
//        ;
//    }
}
