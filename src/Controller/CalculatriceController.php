<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class CalculatriceController extends AbstractController {
    #[Route('/calculatrice/{nbr1}/{nbr2}/{operateur}', name:'app_calcule', requirements:['nbr1' => '-?\d+(\.\d+)?', 'nbr2'=> '-?\d+(\.\d+)?'  ])]
    public function calcul(float $nbr1, float $nbr2, string $operateur):Response{
            $results= null;
            $i = '';
            if($operateur ==='sous'){
                $results = $nbr1 - $nbr2 ;
                $i="-";
            } else if ($operateur==='add') {
                $results = $nbr1 + $nbr2;
                $i="+";
            } else if ($operateur ==='multi'){
                $results = $nbr1 * $nbr2;
                $i="*";
            } else if ($operateur ==='div') {
                $results = $nbr1 / $nbr2;
                $i="/";
            } else {
                throw $this->createNotFoundException('operateur invaldie');
            }

            return $this->render('calculette/index.html.twig', ['results'=>$results, 'nbr1'=>$nbr1, 'nbr2'=>$nbr2, 'operateur'=>$operateur , 'signeOperateur'=>$i]);
    }

}
