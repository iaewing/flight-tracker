export interface FlightPath {
    lat: number;
    lng: number;
    timestamp: number;
    altitude?: number;
    velocity?: number;
    trueTrack?: number;
}

export interface FlightData {
    icao24: string;
    callsign: string;
    originCountry: string;
    latitude: number;
    longitude: number;
    velocity?: number;
    baroAltitude?: number;
    geoAltitude?: number;
    trueTrack?: number;
    verticalRate?: number;
    squawk?: string;
    onGround: boolean;
    hasMovement: boolean;
    pathLength: number;
    flightPath: FlightPath[];
}

export interface AirplanesApiResponse {
    airplanes: FlightData[];
    lastUpdated: number | null;
    historyHours: number;
}
