<?php

namespace App\DataFixtures;

use App\Entity\Book;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use App\Entity\Category;
use App\Entity\User;
use Faker;

class AppFixtures extends Fixture
{
    public function load(ObjectManager $manager): void
    {
        //Création d'un objet Faker
        $faker = Faker\Factory::create('fr_FR');

        for ($i=0; $i < 10; $i++) {
            //Créer des objets
            $category = new Category();
            $category->setName($faker->word());
            // $idCategory = $category->getId();

            $user= new User();
            $data = [
                'Email'=>$faker->email(),
                'Password'=>$faker->password(),
                'Lastname'=>$faker->lastName(),
                'Firstname'=>$faker->firstName()
            ];
            foreach($data as $property=>$value){
                $setter ='set'.$property;
                $user->$setter($value);
            }
            $idUser=$user->getId();

            $book = new Book();
            $dataBook= [
                'Title'=>$faker->sentence(3),
                'Resume'=>$faker->text(),
                'PublishedAt' => \DateTimeImmutable::createFromMutable($faker->dateTime()),
                'Author'=>$faker->name(),
                'User'=>$user
            ];
            foreach($dataBook as $property2=>$value2){
                $setterBook= 'set'.$property2;
                $book->$setterBook($value2);

            }
             $book->addCategory($category);


            //persister l'objet
            $manager->persist($category);
            $manager->persist($user);
            $manager->persist($book);

        }

        //envoyer et exécuter la requête insert
        $manager->flush();
    }
}
