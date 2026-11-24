<?php

namespace App\DataFixtures;

use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use App\Entity\Category;
use App\Entity\User;
use App\Entity\Book;

use Faker;

class AppFixtures extends Fixture
{
    public function load(ObjectManager $manager): void
    {
        //Création d'un objet Faker
        $faker = Faker\Factory::create('fr_FR');
        $categories = [];
        $users = [];
        //Créer les 20 categories
        for ($i = 0; $i < 20; $i++) {
            //Créer des objets
            $category = (new Category())
                ->setName($faker->word());
            //persister l'objet
            $manager->persist($category);
            $categories[] = $category;
        }

        // //Créer les 10 User
        // for ($i = 0; $i < 10; $i++) {
        //     $user = (new User())
        //         ->setFirstname($faker->firstName())
        //         ->setLastname($faker->lastName())
        //         ->setPassword(password_hash($faker->word(), PASSWORD_DEFAULT));
        //     $user->setEmail(
        //         $user->getFirstname() .
        //         "." . $user->getLastname() .
        //         "@" .$faker->freeEmailDomain()
        //         );
        //     $manager->persist($user);
        //     $users[] = $user;
        // }

        //Créer les 60 Book
        for ($i = 0; $i < 60; $i++) {
            $book = (new Book())
                ->setTitle($faker->sentence(3))
                ->setResume($faker->paragraph(2))
                ->setPublishedAt(new \DateTimeImmutable($faker->date('Y-m-d')))
                ->setAuthor($faker->firstName() . " " . $faker->lastName());
                // ->setUser($faker->randomElement($users));
            for ($j = 0; $j < 5; $j++) {
                $book->addCategory($faker->randomElement($categories));
            }

            $manager->persist($book);
        }
        //envoyer et exécuter la requête insert
        $manager->flush();
    }
}
