<?php

namespace App\Jobs;

use App\Models\FlightPosition;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use OpenSky\Laravel\Client\OpenSkyClient;

class PollFlightData implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;
    public int $timeout = 55;

    public function handle(OpenSkyClient $openSky): void
    {
        $bounds = config('opensky.bounding_box');

        try {
            $response = $openSky->withoutCache()->getAllStateVectors(
                lamin: $bounds['lamin'],
                lomin: $bounds['lomin'],
                lamax: $bounds['lamax'],
                lomax: $bounds['lomax'],
            );
        } catch (\Exception $e) {
            Log::error('PollFlightData: API call failed', ['error' => $e->getMessage()]);
            return;
        }

        $pollTime = $response->time ?: time();
        $rows = [];

        foreach ($response->states as $state) {
            if (!$state->latitude || !$state->longitude) {
                continue;
            }

            $rows[] = [
                'icao24'          => $state->icao24,
                'callsign'        => $state->callsign ? trim($state->callsign) : null,
                'origin_country'  => $state->originCountry,
                'polled_at'       => $pollTime,
                'latitude'        => $state->latitude,
                'longitude'       => $state->longitude,
                'baro_altitude'   => $state->baroAltitude,
                'geo_altitude'    => $state->geoAltitude,
                'velocity'        => $state->velocity,
                'true_track'      => $state->trueTrack,
                'vertical_rate'   => $state->verticalRate,
                'squawk'          => $state->squawk,
                'on_ground'       => $state->onGround,
                'position_source' => $state->positionSource,
                'created_at'      => now(),
                'updated_at'      => now(),
            ];
        }

        if (!empty($rows)) {
            FlightPosition::insert($rows);
        }

        $retentionHours = config('opensky.history_hours', 2);
        $cutoff = $pollTime - ($retentionHours * 3600);
        FlightPosition::where('polled_at', '<', $cutoff)->delete();

        Log::info('PollFlightData: completed', [
            'aircraft_count' => count($rows),
            'polled_at'      => $pollTime,
        ]);
    }
}
