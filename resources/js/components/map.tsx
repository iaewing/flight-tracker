import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import getUnicodeFlagIcon from 'country-flag-icons/unicode';
import 'leaflet/dist/leaflet.css';

const MapComponent = ({ flights }: { flights: { lat: number; lng: number; callsign: string; originCountry: string }[] }) => {
    if (!flights || flights.length === 0) {
        return <div>Loading flights...</div>;
    }
   
    return (
        <MapContainer
            center={[flights[0].lat, flights[0].lng]}
            zoom={13}
            style={{ height: "500px", width: "100%" }}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
            />
            {flights.map(flight => (
                <Marker key={flight.callsign} position={[flight.lat, flight.lng]}>
                    <Popup>
                        <span>
                            {getUnicodeFlagIcon(flight.originCountry) + ' ' + flight.callsign}
                        </span>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
};

export default MapComponent;
