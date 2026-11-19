<?php
namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class ProductController extends AbstractController {
    #[Route('/produit/{id}', name: 'app_product_show', requirements:['id'=>'\d+'])]
    public function show(int $id):Response{
        return $this->render('product/product.html.twig', ['id'=> $id]);
    }
}
