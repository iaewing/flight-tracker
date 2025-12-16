import MapComponent from '@/components/map';
import { useEffect, useState } from 'react';
import { getCountryCode } from '@/countryNameToCode';
import { FlightData } from '@/types/flights';

export default function Airplanes({ airplanes }: { airplanes: FlightData[] }) {
    const [flights, setFlights] = useState<FlightData[]>([]);

    useEffect(() => {
        setFlights(airplanes.map((airplane: FlightData) => ({
            icao24: airplane.icao24,
            callsign: airplane.callsign,
            originCountry: getCountryCode(airplane.originCountry) || 'Unknown',
            latitude: airplane.latitude,
            longitude: airplane.longitude,
            velocity: airplane.velocity,
            baroAltitude: airplane.baroAltitude,
            onGround: airplane.onGround,
            hasMovement: airplane.hasMovement,
            pathLength: airplane.pathLength || 0,
            flightPath: airplane.flightPath || [],
        })));
    }, [airplanes]);

    const movingFlights = flights.filter(f => f.hasMovement);
    const stationaryFlights = flights.filter(f => !f.hasMovement && !f.onGround);
    const groundedFlights = flights.filter(f => f.onGround);

    return (
        <>
            <h1>Live Flight Tracker - 60 Minute History</h1>
            <div className="mb-4 grid grid-cols-4 gap-4">
                <div className="bg-blue-100 p-3 rounded">
                    <p className="text-sm text-gray-600">Total Aircraft</p>
                    <p className="text-2xl font-bold text-gray-600">{airplanes.length}</p>
                </div>
                <div className="bg-green-100 p-3 rounded">
                    <p className="text-sm text-gray-600">Moving</p>
                    <p className="text-2xl font-bold text-green-600">{movingFlights.length}</p>
                </div>
                <div className="bg-red-100 p-3 rounded">
                    <p className="text-sm text-gray-600">Stationary</p>
                    <p className="text-2xl font-bold text-red-600">{stationaryFlights.length}</p>
                </div>
                <div className="bg-gray-100 p-3 rounded">
                    <p className="text-sm text-gray-600">On Ground</p>
                    <p className="text-2xl font-bold text-gray-600">{groundedFlights.length}</p>
                </div>
            </div>
            <div className="mb-4 p-4 bg-blue-50 rounded text-gray-600">
                <h3 className="font-semibold mb-2">How to use:</h3>
                <ul className="text-sm space-y-1">
                    <li>🟢 Green markers: Aircraft with detected movement</li>
                    <li>🔴 Red markers: Stationary aircraft</li>
                    <li>⚫ Gray markers: Aircraft on ground</li>
                    <li>📍 Click any moving aircraft to toggle flight path</li>
                </ul>
            </div>
            <div>
                <MapComponent flights={flights} />
                {/*{airplanes.map((airplane: any) => {*/}
                {/*    return (*/}
                {/*        <div key={airplane.icao24}>*/}
                {/*            <p>Callsign: {airplane.callsign}</p>*/}
                {/*            <p>Origin Country: {airplane.originCountry}</p>*/}
                {/*            <p>Time Position: {airplane.timePosition}</p>*/}
                {/*            <p>Last Contact: {airplane.lastContact}</p>*/}
                {/*            <p>Baro Altitude: {airplane.baroAltitude}</p>*/}
                {/*            <p>On Ground: {airplane.onGround ? 'Yes' : 'No'}</p>*/}
                {/*            <p>Velocity: {airplane.velocity}</p>*/}
                {/*            <p>Vertical Rate: {airplane.verticalRate}</p>*/}
                {/*        </div>*/}
                {/*    )*/}
                {/*})}*/}
            </div>
        </>
    );
}
