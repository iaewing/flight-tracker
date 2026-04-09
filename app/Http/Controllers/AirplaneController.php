<?php

namespace App\Http\Controllers;

use App\Models\FlightPosition;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class AirplaneController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('airplanes', [
            'airplanes'    => $this->buildFlightData(),
            'lastUpdated'  => FlightPosition::max('polled_at'),
            'historyHours' => config('opensky.history_hours', 2),
        ]);
    }

    public function apiIndex(): JsonResponse
    {
        return response()->json([
            'airplanes'    => $this->buildFlightData(),
            'lastUpdated'  => FlightPosition::max('polled_at'),
            'historyHours' => config('opensky.history_hours', 2),
        ]);
    }

    private function buildFlightData(): array
    {
        $historySeconds = config('opensky.history_hours', 2) * 3600;
        $since = time() - $historySeconds;

        $latestPollTime = FlightPosition::max('polled_at');

        if (!$latestPollTime) {
            return [];
        }

        $currentAircraft = FlightPosition::where('polled_at', $latestPollTime)
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->get()
            ->keyBy('icao24');

        if ($currentAircraft->isEmpty()) {
            return [];
        }

        $icao24s = $currentAircraft->keys()->toArray();

        $allPositions = FlightPosition::whereIn('icao24', $icao24s)
            ->where('polled_at', '>=', $since)
            ->orderBy('icao24')
            ->orderBy('polled_at')
            ->get()
            ->groupBy('icao24');

        $result = [];

        foreach ($currentAircraft as $icao24 => $current) {
            $path = $allPositions->get($icao24, collect())
                ->filter(fn($p) => $p->latitude && $p->longitude)
                ->map(fn($p) => [
                    'lat'       => $p->latitude,
                    'lng'       => $p->longitude,
                    'timestamp' => $p->polled_at,
                    'altitude'  => $p->baro_altitude,
                    'velocity'  => $p->velocity,
                    'trueTrack' => $p->true_track,
                ])
                ->values()
                ->toArray();

            $hasMovement = count($path) > 1 || ($current->velocity > 0 && !$current->on_ground);

            $result[] = [
                'icao24'        => $icao24,
                'callsign'      => trim($current->callsign ?? 'Unknown'),
                'originCountry' => $current->origin_country,
                'latitude'      => $current->latitude,
                'longitude'     => $current->longitude,
                'velocity'      => $current->velocity,
                'baroAltitude'  => $current->baro_altitude,
                'geoAltitude'   => $current->geo_altitude,
                'trueTrack'     => $current->true_track,
                'verticalRate'  => $current->vertical_rate,
                'squawk'        => $current->squawk,
                'onGround'      => $current->on_ground,
                'hasMovement'   => $hasMovement,
                'pathLength'    => count($path),
                'flightPath'    => $path,
            ];
        }

        return $result;
    }
}
