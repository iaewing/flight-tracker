<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use OpenSky\Laravel\Client\OpenSkyClient;
use OpenSky\Laravel\Client\OpenSkyConfig;
use Illuminate\Support\Facades\Log;

class AirplaneController extends Controller
{
    public function index()
    {
        // Initialize OpenSky client with OAuth credentials from config
        $config = new OpenSkyConfig(
            clientId: config('opensky.client_id'),
            clientSecret: config('opensky.client_secret'),
            oauthTokenUrl: config('opensky.oauth_token_url'),
        );
        $openSky = new OpenSkyClient($config);

        // Define bounding box for Toronto area
        $bounds = [
            'lamin' => 43.184334,
            'lomin' => -80.803070, 
            'lamax' => 43.919330,
            'lomax' => -79.135895
        ];

        // Get currently airborne flights
        $currentStates = $this->getCurrentStateVectors($openSky, $bounds);
        Log::info('Current state vectors retrieved', ['count' => count($currentStates)]);

        // Get historical state vectors for flight paths
        $historicalSnapshots = $this->getHistoricalStateVectors($openSky, $bounds);
        Log::info('Historical snapshots retrieved', ['count' => count($historicalSnapshots)]);

        // Format flight data with paths for frontend
        $flightsWithPaths = $this->enrichFlightsWithPaths($currentStates, $historicalSnapshots);
        Log::info('Formatted flights with paths', ['count' => count($flightsWithPaths)]);

        return Inertia::render('airplanes', [
            'airplanes' => $flightsWithPaths
        ]);
    }

    private function getCurrentStateVectors($openSky, $bounds)
    {
        try {
            $response = $openSky->getAllStateVectors(
                lamin: $bounds['lamin'],
                lomin: $bounds['lomin'],
                lamax: $bounds['lamax'],
                lomax: $bounds['lomax']
            );

            return $response->states ?? [];
        } catch (\Exception $e) {
            Log::error("Failed to get current state vectors: " . $e->getMessage());
            return [];
        }
    }

    private function getHistoricalStateVectors($openSky, $bounds)
    {
        $snapshots = [];
        $currentTime = time();

        // Get snapshots every 3 minutes for the past 60 minutes
        for ($minutesAgo = 0; $minutesAgo <= 60; $minutesAgo += 3) {
            $timestamp = $currentTime - ($minutesAgo * 60);

            try {
                $response = $openSky->getAllStateVectors(
                    lamin: $bounds['lamin'],
                    lomin: $bounds['lomin'],
                    lamax: $bounds['lamax'],
                    lomax: $bounds['lomax'],
                    time: $timestamp
                );

                $snapshots[$minutesAgo] = [
                    'timestamp' => $timestamp,
                    'states' => $response->states ?? [],
                    'minutes_ago' => $minutesAgo
                ];

                Log::debug("Retrieved snapshot at $minutesAgo minutes ago with " . count($response->states ?? []) . " aircraft");
            } catch (\Exception $e) {
                Log::warning("Failed to get snapshot at $minutesAgo minutes ago: " . $e->getMessage());
                $snapshots[$minutesAgo] = [
                    'timestamp' => $timestamp,
                    'states' => [],
                    'minutes_ago' => $minutesAgo
                ];
            }
        }

        return $snapshots;
    }

    private function enrichFlightsWithPaths($currentStates, $historicalSnapshots)
    {
        $formatted = [];

        foreach ($currentStates as $state) {
            // Skip if missing position data
            if (!$state->latitude || !$state->longitude) {
                continue;
            }

            $icao24 = $state->icao24;
            $flightPath = [];

            // Build flight path from historical snapshots (oldest to newest)
            for ($minutesAgo = 60; $minutesAgo >= 0; $minutesAgo -= 3) {
                $snapshot = $historicalSnapshots[$minutesAgo] ?? null;
                if (!$snapshot) continue;

                // Find this aircraft in the historical snapshot
                $historicalState = collect($snapshot['states'])->first(function ($s) use ($icao24) {
                    return $s->icao24 === $icao24;
                });

                if ($historicalState && $historicalState->latitude && $historicalState->longitude) {
                    $flightPath[] = [
                        'lat' => $historicalState->latitude,
                        'lng' => $historicalState->longitude,
                        'timestamp' => $snapshot['timestamp'],
                        'altitude' => $historicalState->baroAltitude,
                        'velocity' => $historicalState->velocity
                    ];
                }
            }

            // Determine if flight is moving (has history OR currently moving)
            $hasMovement = count($flightPath) > 0 || ($state->velocity > 0 && !$state->onGround);

            $formatted[] = [
                'icao24' => $icao24,
                'callsign' => trim($state->callsign ?: 'Unknown'),
                'originCountry' => $state->originCountry,
                'latitude' => $state->latitude,
                'longitude' => $state->longitude,
                'velocity' => $state->velocity,
                'baroAltitude' => $state->baroAltitude,
                'onGround' => $state->onGround,
                'hasMovement' => $hasMovement,
                'pathLength' => count($flightPath),
                'flightPath' => $flightPath,
            ];
        }

        return $formatted;
    }

    private function combineFlightData($firstStates, $secondStates)
    {
        $combined = [];

        // Create a lookup for second states by ICAO24
        $secondStatesLookup = [];
        foreach ($secondStates as $state) {
            $secondStatesLookup[$state->icao24] = $state;
        }

        // Combine first and second states for aircraft present in both
        foreach ($firstStates as $firstState) {
            $icao24 = $firstState->icao24;

            if (isset($secondStatesLookup[$icao24])) {
                $secondState = $secondStatesLookup[$icao24];

                // Only include if both positions are valid
                if ($firstState->latitude && $firstState->longitude && 
                    $secondState->latitude && $secondState->longitude) {

                    $combined[] = [
                        'icao24' => $icao24,
                        'callsign' => trim($firstState->callsign ?: 'Unknown'),
                        'originCountry' => $firstState->originCountry,
                        'timePosition' => $firstState->timePosition,
                        'lastContact' => $firstState->lastContact,
                        'velocity' => $firstState->velocity,
                        'verticalRate' => $firstState->verticalRate,
                        'baroAltitude' => $firstState->baroAltitude,
                        'onGround' => $firstState->onGround,
                        // Current position (second snapshot)
                        'latitude' => $secondState->latitude,
                        'longitude' => $secondState->longitude,
                        // Previous position for tracking movement
                        'previousLatitude' => $firstState->latitude,
                        'previousLongitude' => $firstState->longitude,
                        // Calculate movement
                        'hasMovement' => $this->hasSignificantMovement($firstState, $secondState),
                    ];
                }
            }
        }

        return $combined;
    }

    private function hasSignificantMovement($firstState, $secondState)
    {
        $latDiff = abs($firstState->latitude - $secondState->latitude);
        $lonDiff = abs($firstState->longitude - $secondState->longitude);

        // Consider movement significant if position changed by more than 0.001 degrees
        // This is roughly 100 meters
        return ($latDiff > 0.001 || $lonDiff > 0.001);
    }
}