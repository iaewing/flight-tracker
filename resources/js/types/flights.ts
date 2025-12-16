export interface FlightPath {
    lat: number;
    lng: number;
    timestamp: number;
    altitude?: number;
    velocity?: number;
}

export interface FlightData {
    icao24: string;
    callsign: string;
    originCountry: string;
    latitude: number;
    longitude: number;
    velocity?: number;
    baroAltitude?: number;
    onGround: boolean;
    hasMovement: boolean;
    pathLength: number;
    flightPath: Array<FlightPath>;
}
