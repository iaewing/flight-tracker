<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use OpenSky\Laravel\Facades\OpenSky;
use OpenSky\Laravel\Client\OpenSkyClient;

class AirplaneController extends Controller
{
    public function index()
    {
        $openSky = new OpenSkyClient();
        $flights = $openSky->getAllStateVectors(lamin: 43.184334, lomin: -80.803070, lamax: 43.919330, lomax: -79.135895);

        // dd($flights->states);
        
        return Inertia::render('airplanes', [
            'airplanes' => $flights->states
        ]);
    }
}