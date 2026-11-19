<?php
namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;


class HomeController extends AbstractController {
 private array $formations = [
    [
        'title' => 'Développement PHP',
        'description' => 'Maîtriser les bases de la programmation orientée objet côté serveur.',
    ],
    [
        'title' => 'Symfony',
        'description' => 'Structurer une application web robuste avec l’architecture MVC et Doctrine.',
    ],
    [
        'title' => 'Twig & Tailwind CSS',
        'description' => 'Concevoir des interfaces modernes, réactives et réutilisables avec des composants.',
    ],
    [
        'title' => 'Bases de données SQL',
        'description' => 'Modéliser des schémas relationnels et optimiser ses requêtes sous MySQL/MariaDB.',
    ],
    [
        'title' => 'API REST & Sécurité',
        'description' => 'Créer des points d’accès sécurisés avec authentification JWT et validation des données.',
    ],
];


    public function index():Response{

        return $this->render('home/index.html.twig', ['formations'=>$this->formations]);
    }
}

