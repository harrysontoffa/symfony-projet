<?php

namespace App\Controller;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use App\Entity\User;
use Symfony\Component\Security\Http\Attribute\IsGranted;

class AdminController extends AbstractController {

    #[Route('/admin/test', name:'app_admin')]
    #[IsGranted('ROLE_ADMIN')]
    public function testAdmin():Response{
        $testeAffichage ="admin route fonction";

        return $this->render('admin/index.html.twig' ,['essais'=>$testeAffichage]);
    }



}
