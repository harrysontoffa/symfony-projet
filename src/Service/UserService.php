<?php
namespace App\Service;

use App\Repository\UserRepository;
use App\Entity\User;

class UserService {
    public function __construct(  private UserRepository $userRepository)
    {}
    public function getUsers():array{
    return $this->userRepository->findAll() ?? [] ;
    }


}
