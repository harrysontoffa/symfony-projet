<?php
namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use  App\Service\UserService;
use Symfony\Component\Routing\Attribute\Route;

class UserController extends AbstractController{
    private UserService $userService;
    public function __construct(UserService $userService)
    {
        $this->userService=$userService;
    }
   #[Route('/users', name: 'app_showUser')]
    public function showAllUser():Response {
        $user= $this->userService->getUsers();
        return $this->render('user/show_all_user.html.twig',["user"=>$user]);
    }
    public function inscription():Response {

        return $this->render('user/inscription.html.twig');
    }


}
