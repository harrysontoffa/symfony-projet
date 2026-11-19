<?php
namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;



class ContactController extends AbstractController{
    #[Route('/contact/{name}/{mail}/{numero}', name: 'app_contact')]
public function contact(string $name, string $mail, string $numero):Response{

    return $this->render('contact/index.html.twig', ['name' => $name, 'mail'=>$mail, 'numero' => $numero ]);
}

}
