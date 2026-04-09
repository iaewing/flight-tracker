<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('flight_positions', function (Blueprint $table) {
            $table->id();
            $table->string('icao24', 8);
            $table->string('callsign', 10)->nullable();
            $table->string('origin_country', 64)->nullable();
            $table->integer('polled_at');
            $table->float('latitude')->nullable();
            $table->float('longitude')->nullable();
            $table->float('baro_altitude')->nullable();
            $table->float('geo_altitude')->nullable();
            $table->float('velocity')->nullable();
            $table->float('true_track')->nullable();
            $table->float('vertical_rate')->nullable();
            $table->string('squawk', 4)->nullable();
            $table->boolean('on_ground')->default(false);
            $table->tinyInteger('position_source')->default(0);
            $table->timestamps();

            $table->index('icao24');
            $table->index(['icao24', 'polled_at']);
            $table->index('polled_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('flight_positions');
    }
};
