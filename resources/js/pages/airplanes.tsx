import MapComponent from '@/components/map';
import AppLayout from '@/layouts/app-layout';
import { Deferred, Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { getCountryCode } from '@/countryNameToCode';
import { FlightData } from '@/types/flights';

function StatCardSkeleton() {
    return <div className="bg-gray-100 p-3 rounded border border-gray-100 animate-pulse h-[72px]" />;
}

function AirplanesContent({ airplanes }: { airplanes: FlightData[] }) {
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
            <div className="mb-4 grid grid-cols-4 gap-4">
                <div className="bg-blue-50 p-3 rounded border border-blue-100">
                    <p className="text-sm text-gray-500">Total Aircraft</p>
                    <p className="text-2xl font-bold text-gray-800">{airplanes.length}</p>
                </div>
                <div className="bg-green-50 p-3 rounded border border-green-100">
                    <p className="text-sm text-gray-500">Moving</p>
                    <p className="text-2xl font-bold text-green-600">{movingFlights.length}</p>
                </div>
                <div className={`p-3 rounded border ${stationaryFlights.length > 0 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                    <p className="text-sm text-gray-500">Stationary</p>
                    <p className={`text-2xl font-bold ${stationaryFlights.length > 0 ? 'text-red-600' : 'text-gray-400'}`}>{stationaryFlights.length}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded border border-gray-100">
                    <p className="text-sm text-gray-500">On Ground</p>
                    <p className="text-2xl font-bold text-gray-600">{groundedFlights.length}</p>
                </div>
            </div>
            <div className="mb-4">
                <MapComponent flights={flights} />
            </div>
            <div className="p-3 bg-gray-50 border border-gray-100 rounded text-gray-500 text-sm flex gap-6">
                <span>🟢 Moving</span>
                <span>🔴 Stationary</span>
                <span>⚫ On Ground</span>
                <span>📍 Click a moving aircraft to toggle its 60-min flight path</span>
            </div>
        </>
    );
}

export default function Airplanes({ airplanes }: { airplanes?: FlightData[] }) {
    return (
        <AppLayout>
            <Head title="Flight Tracker" />
            <div className="flex flex-col gap-4 p-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Live Flight Tracker — 60 Minute History</h1>
            <Deferred
                data="airplanes"
                fallback={
                    <>
                        <div className="mb-4 grid grid-cols-4 gap-4">
                            <StatCardSkeleton />
                            <StatCardSkeleton />
                            <StatCardSkeleton />
                            <StatCardSkeleton />
                        </div>
                        <div className="mb-4 w-full rounded bg-gray-100 animate-pulse" style={{ height: '600px' }} />
                    </>
                }
            >
                <AirplanesContent airplanes={airplanes ?? []} />
            </Deferred>
            </div>
        </AppLayout>
    );
}
