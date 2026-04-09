import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import getUnicodeFlagIcon from 'country-flag-icons/unicode';
import { hasFlag } from 'country-flag-icons';
import { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { FlightData } from '@/types/flights';

function createAircraftIcon(trueTrack: number | undefined, onGround: boolean): L.DivIcon {
    // ✈ character points east (90°); subtract 90° so 0° = north
    const rotation = (trueTrack ?? 0) - 90;
    const color = onGround ? '#6b7280' : '#3b82f6';

    return L.divIcon({
        className: '',
        html: `<div style="width:24px;height:24px;transform:rotate(${rotation}deg);transform-origin:center;display:flex;align-items:center;justify-content:center;color:${color};font-size:20px;filter:drop-shadow(0 1px 1px rgba(0,0,0,0.4))">✈</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -14],
    });
}

function altitudeColor(alt: number | undefined): string {
    if (!alt || alt <= 0) return '#6b7280';  // gray — ground/unknown
    if (alt < 3000)  return '#22c55e';        // green — low
    if (alt < 7000)  return '#eab308';        // yellow — medium
    if (alt < 11000) return '#f97316';        // orange — high
    return '#ef4444';                          // red — cruise
}

const MapComponent = ({ flights }: { flights: FlightData[] }) => {
    const [selectedFlights, setSelectedFlights] = useState<Set<string>>(new Set());
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    if (!mounted) {
        return <div style={{ height: '600px' }} className="w-full rounded bg-gray-100 animate-pulse" />;
    }

    if (!flights || flights.length === 0) {
        return (
            <div style={{ height: '600px' }} className="w-full rounded bg-gray-100 flex items-center justify-center text-gray-500">
                No flight data yet — waiting for first poll
            </div>
        );
    }

    const centerLat = flights.reduce((sum, f) => sum + f.latitude, 0) / flights.length;
    const centerLng = flights.reduce((sum, f) => sum + f.longitude, 0) / flights.length;

    const toggleFlightPath = (icao24: string) => {
        const newSelected = new Set(selectedFlights);
        if (newSelected.has(icao24)) {
            newSelected.delete(icao24);
        } else {
            newSelected.add(icao24);
        }
        setSelectedFlights(newSelected);
    };

    return (
        <MapContainer
            center={[centerLat, centerLng]}
            zoom={7}
            style={{ height: '600px', width: '100%' }}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
            />

            {/* Altitude-colored path segments for selected flights */}
            {flights
                .filter(flight => selectedFlights.has(flight.icao24) && flight.hasMovement && flight.flightPath.length >= 2)
                .map(flight =>
                    flight.flightPath.slice(0, -1).map((pt, i) => {
                        const next = flight.flightPath[i + 1];
                        return (
                            <Polyline
                                key={`seg-${flight.icao24}-${i}`}
                                positions={[[pt.lat, pt.lng], [next.lat, next.lng]]}
                                pathOptions={{
                                    color: altitudeColor(pt.altitude),
                                    weight: 3,
                                    opacity: 0.85,
                                }}
                            />
                        );
                    })
                )
            }

            {/* Aircraft markers with heading-rotated icons */}
            {flights.map(flight => (
                <Marker
                    key={flight.icao24}
                    position={[flight.latitude, flight.longitude]}
                    icon={createAircraftIcon(flight.trueTrack, flight.onGround)}
                    eventHandlers={{
                        click: () => toggleFlightPath(flight.icao24),
                    }}
                >
                    <Popup>
                        <div className="text-sm min-w-[180px]">
                            <div className="font-semibold mb-2 text-base">
                                {hasFlag(flight.originCountry) ? getUnicodeFlagIcon(flight.originCountry) : ''} {flight.callsign}
                            </div>
                            <div className="space-y-1 text-xs">
                                <div><span className="text-gray-500">ICAO24:</span> {flight.icao24}</div>
                                <div><span className="text-gray-500">Status:</span> {flight.onGround ? '🛬 On Ground' : '✈️ Airborne'}</div>
                                {flight.velocity != null && (
                                    <div><span className="text-gray-500">Speed:</span> {Math.round(flight.velocity * 3.6)} km/h</div>
                                )}
                                {flight.baroAltitude != null && (
                                    <div><span className="text-gray-500">Baro Alt:</span> {Math.round(flight.baroAltitude).toLocaleString()}m</div>
                                )}
                                {flight.geoAltitude != null && (
                                    <div><span className="text-gray-500">Geo Alt:</span> {Math.round(flight.geoAltitude).toLocaleString()}m</div>
                                )}
                                {flight.trueTrack != null && (
                                    <div><span className="text-gray-500">Heading:</span> {Math.round(flight.trueTrack)}°</div>
                                )}
                                {flight.verticalRate != null && flight.verticalRate !== 0 && (
                                    <div>
                                        <span className="text-gray-500">V/S:</span>{' '}
                                        {flight.verticalRate > 0 ? '⬆' : '⬇'}{' '}
                                        {Math.abs(Math.round(flight.verticalRate * 196.85))} ft/min
                                    </div>
                                )}
                                {flight.squawk && (
                                    <div><span className="text-gray-500">Squawk:</span> {flight.squawk}</div>
                                )}
                                <div><span className="text-gray-500">Path Points:</span> {flight.pathLength}</div>
                                <div className="text-xs text-gray-500 mt-2">
                                    {flight.hasMovement && flight.flightPath.length >= 2 ? (
                                        selectedFlights.has(flight.icao24) ?
                                            '🎯 Click to hide flight path' :
                                            '📍 Click to show flight path'
                                    ) : (
                                        '⚪ No significant movement recorded'
                                    )}
                                </div>
                            </div>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
};

export default MapComponent;
