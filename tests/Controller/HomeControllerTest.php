<?php

namespace App\Tests\Controller;

use App\Entity\Book;
use App\Entity\Category;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

final class HomeControllerTest extends WebTestCase
{
    private KernelBrowser $client;
    private EntityManagerInterface $entityManager;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        $this->entityManager = static::getContainer()->get(EntityManagerInterface::class);

        // Base de test vide à chaque test (les livres d'abord : ils portent la table de jointure).
        foreach ([Book::class, Category::class] as $class) {
            foreach ($this->entityManager->getRepository($class)->findAll() as $entity) {
                $this->entityManager->remove($entity);
            }
            $this->entityManager->flush();
        }
    }

    public function testTheStoryShowsTheLiveCatalogue(): void
    {
        $voyage = (new Category())->setName('Voyage');
        $poesie = (new Category())->setName('Poésie');
        $vide = (new Category())->setName('Sans livre');
        $this->entityManager->persist($voyage);
        $this->entityManager->persist($poesie);
        $this->entityManager->persist($vide);

        $bateau = $this->book('Le Bateau ivre', 'Arthur Rimbaud', $voyage, $poesie);
        $tour = $this->book('Le Tour du monde en 80 jours', 'Jules Verne', $voyage);
        $this->entityManager->flush();

        $crawler = $this->client->request('GET', '/');

        self::assertResponseIsSuccessful();

        // Le récit complet : prologue, quatre chapitres, épilogue.
        foreach (['prologue', 'chapitre-1', 'chapitre-2', 'chapitre-3', 'chapitre-4', 'epilogue'] as $id) {
            self::assertSelectorExists('#'.$id);
        }
        self::assertSelectorTextContains('h1', 'Chaque livre est une porte');

        // Chapitre I : le nombre réel de livres.
        self::assertSelectorTextSame('[data-story-target="count"]', '2');

        // Chapitre II : seules les catégories non vides, avec leur nombre de livres, la plus fournie d'abord.
        $chips = $crawler->filter('[data-story-target="chip"]');
        self::assertCount(2, $chips);
        self::assertStringContainsString('Voyage', $chips->eq(0)->text());
        self::assertStringContainsString('2', $chips->eq(0)->filter('span')->text());
        self::assertSame('/search/category/Voyage', $chips->eq(0)->attr('href'));
        self::assertStringNotContainsString('Sans livre', $crawler->filter('[data-story-target="wave"]')->text());

        // Chapitre III : les derniers livres arrivés, le plus récent en premier, reliés à leur fiche.
        $windows = $crawler->filter('[data-story-target="window"] a');
        self::assertCount(2, $windows);
        self::assertStringContainsString('Le Tour du monde en 80 jours', $windows->eq(0)->text());
        self::assertSame('/book/'.$tour->getId(), $windows->eq(0)->attr('href'));
        self::assertSame('/book/'.$bateau->getId(), $windows->eq(1)->attr('href'));

        // Chapitre IV : les parcours de formation.
        self::assertCount(5, $crawler->filter('.story-sky__item'));

        // Épilogue : un visiteur anonyme est invité à s'inscrire ou à se connecter.
        self::assertSelectorTextContains('.story-letter', 'Bonsoir à vous qui lisez ces lignes');
        self::assertCount(1, $crawler->filter('.story-letter a[href="/register"]'));
        self::assertCount(1, $crawler->filter('.story-letter a[href="/login"]'));
    }

    public function testAnEmptyLibraryStillTellsTheStory(): void
    {
        $this->client->request('GET', '/');

        self::assertResponseIsSuccessful();
        self::assertSelectorTextContains('#chapitre-1', 'Les étagères attendent leur tout premier livre');
        self::assertSelectorTextContains('#chapitre-3', 'Les fenêtres sont encore éteintes');
        self::assertSelectorNotExists('[data-story-target="chip"]');
    }

    private function book(string $title, string $author, Category ...$categories): Book
    {
        $book = (new Book())
            ->setTitle($title)
            ->setAuthor($author)
            ->setResume('Un résumé.');
        foreach ($categories as $category) {
            $book->addCategory($category);
        }
        $this->entityManager->persist($book);

        return $book;
    }
}
