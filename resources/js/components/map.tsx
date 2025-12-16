import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import getUnicodeFlagIcon from 'country-flag-icons/unicode';
import { hasFlag } from 'country-flag-icons';
import { useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { FlightData } from '@/types/flights';

const MapComponent = ({ flights }: { flights: FlightData[] }) => {
    const [selectedFlights, setSelectedFlights] = useState<Set<string>>(new Set());

    console.log(flights[0])

    if (!flights || flights.length === 0) {
        return <div>Loading flights...</div>;
    }

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
        <div></div>
        // <MapContainer
        //     center={[flights[0].latitude, flights[0].longitude]}
        //     zoom={11}
        //     style={{ height: "1000px", width: "100%" }}
        // >
        //     <TileLayer
        //         url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        //         attribution="&copy; OpenStreetMap contributors"
        //     />

        //     {/* Render flight paths for selected flights */}
        //     {flights
        //         .filter(flight => selectedFlights.has(flight.icao24) && flight.hasMovement && flight.flightPath.length >= 2)
        //         .map(flight => (
        //             <Polyline
        //                 key={`path-${flight.icao24}`}
        //                 positions={flight.flightPath.map(point => [point.lat, point.lng])}
        //                 pathOptions={{
        //                     color: "#3b82f6",
        //                     weight: 3,
        //                     opacity: 0.7
        //                 }}
        //             />
        //         ))
        //     }
        //     {/* Render markers */}
        //     {flights.map(flight => (
        //         <Marker
        //             key={flight.icao24}
        //             position={[flight.latitude, flight.longitude]}
        //             eventHandlers={{
        //                 click: () => toggleFlightPath(flight.icao24),
        //             }}
        //         >
        //             <Popup>
        //                 <div className="text-sm">
        //                     <div className="font-semibold mb-2">
        //                         {hasFlag(flight.originCountry) ? getUnicodeFlagIcon(flight.originCountry) : ''} {flight.callsign}
        //                     </div>
        //                     <div className="space-y-1">
        //                         <div>ICAO24: {flight.icao24}</div>
        //                         <div>Status: {flight.onGround ? '🛬 On Ground' : '✈️ Airborne'}</div>
        //                         {flight.velocity && <div>Speed: {Math.round(flight.velocity * 3.6)} km/h</div>}
        //                         {flight.baroAltitude && <div>Altitude: {Math.round(flight.baroAltitude)}m</div>}
        //                         <div>Path Points: {flight.pathLength}</div>
        //                         <div className="text-xs text-gray-600 mt-2">
        //                             {flight.hasMovement && flight.flightPath.length >= 2 ? (
        //                                 selectedFlights.has(flight.icao24) ?
        //                                     '🎯 Click to hide 60-minute flight path' :
        //                                     '📍 Click to show 60-minute flight path'
        //                             ) : (
        //                                 '⚪ No significant movement in the past 60 minutes'
        //                             )}
        //                         </div>
        //                     </div>
        //                 </div>
        //             </Popup>
        //         </Marker>
        //     ))}
        // </MapContainer>
    );
};

export default MapComponent;
