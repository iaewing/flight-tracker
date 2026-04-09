<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FlightPosition extends Model
{
    protected $fillable = [
        'icao24',
        'callsign',
        'origin_country',
        'polled_at',
        'latitude',
        'longitude',
        'baro_altitude',
        'geo_altitude',
        'velocity',
        'true_track',
        'vertical_rate',
        'squawk',
        'on_ground',
        'position_source',
    ];

    protected $casts = [
        'polled_at'       => 'integer',
        'on_ground'       => 'boolean',
        'latitude'        => 'float',
        'longitude'       => 'float',
        'baro_altitude'   => 'float',
        'geo_altitude'    => 'float',
        'velocity'        => 'float',
        'true_track'      => 'float',
        'vertical_rate'   => 'float',
        'position_source' => 'integer',
    ];
}
