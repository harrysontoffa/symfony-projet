<?php

namespace App\Controller;

use App\Entity\User;
use App\Form\RegistrationFormType;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Contracts\Translation\TranslatorInterface;
use App\Repository\RoleRepository;
use Symfony\Component\HttpFoundation\File\Exception\FileException;
use Symfony\Component\String\Slugger\SluggerInterface;



class RegistrationController extends AbstractController
{
    #[Route('/register', name: 'app_register')]
    public function register(Request $request, SluggerInterface $slugger, UserPasswordHasherInterface $userPasswordHasher, EntityManagerInterface $entityManager, RoleRepository $roleRepository): Response
    {
        $user = new User();
        $form = $this->createForm(RegistrationFormType::class, $user);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            /** @var string $plainPassword */
            $plainPassword = $form->get('plainPassword')->getData();

            // encode the plain password
            $user->setPassword($userPasswordHasher->hashPassword($user, $plainPassword));

            $iconFile=$form->get('icon')->getData();

            if($iconFile){
                $originaleFileName = pathinfo($iconFile->getClientOriginalName(), PATHINFO_FILENAME);
                $safeFilname= $slugger->slug($originaleFileName);
                $newFilename= $safeFilname . '-'.uniqid(). '-'. $iconFile->guessExtension();

                try {
                    $iconFile->move(
                        $this->getParameter('icons_directory'),
                        $newFilename

                    );
                    $user->setIcon($newFilename);

                } catch (FileException $e) {
                    $this->addFlash('error', 'Erreur lors de l\'envoi de l\'image.');
                    $user->setIcon('profil.png');
                }
            } else {
                $user->setIcon('profil.png');
            }

            $deaultRole= $roleRepository->find(6);
            if(!$deaultRole){
                throw $this->createNotFoundException(('Le rôlr par defaut est introuvable en base de données'));
            }
            $user->setRole($deaultRole);

            $entityManager->persist($user);
            $entityManager->flush();

            // do anything else you need here, like send an email

            return $this->redirectToRoute('app_login');
        }

        return $this->render('registration/register.html.twig', [
            'registrationForm' => $form,
        ]);
    }
}
