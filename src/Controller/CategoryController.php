<?php
namespace App\Controller;

namespace App\Controller;

use App\Entity\Category;
use App\Repository\CategoryRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\HttpFoundation\Request;
use App\Form\CategoryType;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Security\Http\Attribute\IsGranted;


class CategoryController extends AbstractController {

    public function categories(CategoryRepository $categoryRepository,):Response{
        $categories = $categoryRepository->createQueryBuilder('c')
        ->select('c.id,c.name')
        ->getQuery()
        ->getArrayResult();

        return $this->render('partials/_navbar_categories.html.twig', ['categories'=> $categories]);
    }

    #[Route('/Ajout/category', name:'app_add_categorie')]
    #[IsGranted('ROLE_ADMIN')]
    public function addCategory(Request $request, CategoryRepository $categoryRepository,):Response{

    $category= new Category();
    $form= $this->createForm(CategoryType::class, $category);
    $form->handleRequest($request); // handleRequest() remplit déjà $category->name automatiquement
    if($form->isSubmitted() && $form->isValid()){
        $categoryRepository->save($category);
            return $this->redirectToRoute('app_add_categorie');

    }
    return $this->render('category/index.html.twig', [
            'categoryForm' => $form,
        ]);
}
 #[Route('/edit/category/{id}', name:'app_update_categorie')]
    #[IsGranted('ROLE_ADMIN')]
    public function updateCategory(Request $request,  CategoryRepository $categoryRepository, Category $category ){
        $form = $this->createForm(CategoryType::class, $category);
        $form->handleRequest($request);
        if($form->isSubmitted() && $form->isValid()){
            $categoryRepository->save($category);
            $this->addFlash('success', 'Catégorie modifiée avec succès !');
            return $this->redirectToRoute('app_update_categorie', ['id' => $category->getId()]);
        }
        return $this->render('category/edit.html.twig', ['categoryForm'=>$form, 'category'=>$category]);
    }
}
