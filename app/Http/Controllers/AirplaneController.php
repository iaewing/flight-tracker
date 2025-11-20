<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use OpenSky\Laravel\Facades\OpenSky;
use OpenSky\Laravel\Client\OpenSkyClient;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class AirplaneController extends Controller
{
    public function index()
    {
        // Initialize OpenSky client with OAuth credentials from config
        $openSky = new OpenSkyClient(
            clientId: config('opensky.client_id'),
            clientSecret: config('opensky.client_secret'),
        );
        
        // Define bounding box for Toronto area
        $bounds = [
            'lamin' => 43.184334,
            'lomin' => -80.803070, 
            'lamax' => 43.919330,
            'lomax' => -79.135895
        ];
        
        // Get multiple time snapshots (current, 1min ago, 2min ago, 3min ago, 4min ago, 5min ago)
        $snapshots = $this->getHistoricalSnapshots($openSky, $bounds);
        
        // Combine the data to track movement over time
        $flightsWithPaths = $this->combineHistoricalData($snapshots);
        
        return Inertia::render('airplanes', [
            'airplanes' => $flightsWithPaths
        ]);
    }
    
    private function getHistoricalSnapshots($openSky, $bounds)
    {
        $snapshots = [];
        $currentTime = time();
        
        // Get snapshots every 3 minutes for the past 60 minutes (21 snapshots total)
        for ($minutesAgo = 0; $minutesAgo <= 60; $minutesAgo += 3) {
            $timestamp = $currentTime - ($minutesAgo * 60); // Unix timestamp minus seconds

            try {
                $snapshot = $openSky->getAllStateVectors(
                    lamin: $bounds['lamin'],
                    lomin: $bounds['lomin'],
                    lamax: $bounds['lamax'],
                    lomax: $bounds['lomax'],
                    time: $timestamp
                );
                
                $snapshots[$minutesAgo] = [
                    'timestamp' => $timestamp,
                    'states' => $snapshot->states ?? [],
                    'request_time' => date('Y-m-d H:i:s', $timestamp),
                    'minutes_ago' => $minutesAgo
                ];
            } catch (\Exception $e) {
                // If historical data fails, continue with other snapshots
                Log::error("Failed to get snapshot for {$minutesAgo} minutes ago (timestamp: {$timestamp}): " . $e->getMessage());
                $snapshots[$minutesAgo] = [
                    'timestamp' => $timestamp,
                    'states' => [],
                    'request_time' => date('Y-m-d H:i:s', $timestamp),
                    'minutes_ago' => $minutesAgo,
                    'error' => $e->getMessage()
                ];
            }
        }
        
        return $snapshots;
    }
    
    private function combineHistoricalData($snapshots)
    {
        $combined = [];
        
        // Use current snapshot (0 minutes ago) as base
        $currentStates = $snapshots[0]['states'] ?? [];
        
        foreach ($currentStates as $currentState) {
            if (!$currentState->latitude || !$currentState->longitude) {
                continue;
            }
            
            $icao24 = $currentState->icao24;
            $flightPath = [];
            $hasMovement = false;
            
            // Build flight path from historical data (oldest to newest)
            for ($minutesAgo = 60; $minutesAgo >= 0; $minutesAgo -= 3) {
                $snapshot = $snapshots[$minutesAgo] ?? null;
                if (!$snapshot) continue;
                
                // Find this aircraft in the historical snapshot
                $historicalState = collect($snapshot['states'])->first(function ($state) use ($icao24) {
                    return $state->icao24 === $icao24;
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
            
            // Check if aircraft has moved significantly
            if (count($flightPath) >= 2) {
                $firstPoint = $flightPath[0];
                $lastPoint = end($flightPath);
                
                $latDiff = abs($firstPoint['lat'] - $lastPoint['lat']);
                $lonDiff = abs($firstPoint['lng'] - $lastPoint['lng']);
                
                // Consider movement significant if position changed by more than 0.005 degrees
                // This is roughly 500 meters over 60 minutes (very conservative for aircraft)
                $hasMovement = ($latDiff > 0.005 || $lonDiff > 0.005);
            }
            
            $combined[] = [
                'icao24' => $icao24,
                'callsign' => trim($currentState->callsign ?: 'Unknown'),
                'originCountry' => $currentState->originCountry,
                'timePosition' => $currentState->timePosition,
                'lastContact' => $currentState->lastContact,
                'velocity' => $currentState->velocity,
                'verticalRate' => $currentState->verticalRate,
                'baroAltitude' => $currentState->baroAltitude,
                'onGround' => $currentState->onGround,
                // Current position
                'latitude' => $currentState->latitude,
                'longitude' => $currentState->longitude,
                // Flight path data
                'flightPath' => $flightPath,
                'hasMovement' => $hasMovement,
                'pathLength' => count($flightPath),
            ];
        }
        
        return $combined;
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