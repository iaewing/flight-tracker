import MapComponent from '@/components/map';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { getCountryCode } from '@/countryNameToCode';
import { AirplanesApiResponse, FlightData } from '@/types/flights';

const POLL_INTERVAL_MS = 60_000;

function StatCardSkeleton() {
    return <div className="bg-gray-100 p-3 rounded border border-gray-100 animate-pulse h-[72px]" />;
}

function mapAirplane(airplane: FlightData): FlightData {
    return {
        ...airplane,
        originCountry: getCountryCode(airplane.originCountry) || 'Unknown',
        flightPath: airplane.flightPath || [],
        pathLength: airplane.pathLength || 0,
    };
}

export default function Airplanes({
    airplanes: initialAirplanes,
    lastUpdated: initialLastUpdated,
    historyHours,
}: {
    airplanes: FlightData[];
    lastUpdated: number | null;
    historyHours: number;
}) {
    const [flights, setFlights] = useState<FlightData[]>([]);
    const [lastUpdated, setLastUpdated] = useState<number | null>(initialLastUpdated);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        setFlights(initialAirplanes.map(mapAirplane));
    }, []);

    useEffect(() => {
        intervalRef.current = setInterval(async () => {
            setIsRefreshing(true);
            try {
                const res = await fetch('/api/airplanes');
                const data: AirplanesApiResponse = await res.json();
                setFlights(data.airplanes.map(mapAirplane));
                setLastUpdated(data.lastUpdated);
            } catch (e) {
                console.error('Failed to refresh flight data', e);
            } finally {
                setIsRefreshing(false);
            }
        }, POLL_INTERVAL_MS);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    const movingFlights = flights.filter(f => f.hasMovement);
    const stationaryFlights = flights.filter(f => !f.hasMovement && !f.onGround);
    const groundedFlights = flights.filter(f => f.onGround);

    const lastUpdatedLabel = lastUpdated
        ? new Date(lastUpdated * 1000).toLocaleTimeString()
        : null;

    return (
        <AppLayout>
            <Head title="Flight Tracker" />
            <div className="flex flex-col gap-4 p-4">
                <div className="flex items-baseline justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Live Flight Tracker — {historyHours}h History
                    </h1>
                    <span className="text-xs text-gray-400">
                        {isRefreshing
                            ? 'Refreshing...'
                            : lastUpdatedLabel
                                ? `Updated ${lastUpdatedLabel}`
                                : 'No data yet — waiting for first poll'}
                    </span>
                </div>
                {flights.length === 0 ? (
                    <>
                        <div className="mb-4 grid grid-cols-4 gap-4">
                            <StatCardSkeleton />
                            <StatCardSkeleton />
                            <StatCardSkeleton />
                            <StatCardSkeleton />
                        </div>
                        <div className="mb-4 w-full rounded bg-gray-100 animate-pulse" style={{ height: '600px' }} />
                    </>
                ) : (
                    <>
                        <div className="grid grid-cols-4 gap-4">
                            <div className="bg-blue-50 p-3 rounded border border-blue-100">
                                <p className="text-sm text-gray-500">Total Aircraft</p>
                                <p className="text-2xl font-bold text-gray-800">{flights.length}</p>
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
                        <MapComponent flights={flights} />
                        <div className="p-3 bg-gray-50 border border-gray-100 rounded text-gray-500 text-sm flex gap-6">
                            <span>🟢 Moving</span>
                            <span>🔴 Stationary</span>
                            <span>⚫ On Ground</span>
                            <span>📍 Click a moving aircraft to toggle its {historyHours}h flight path</span>
                        </div>
                    </>
                )}
            </div>
        </AppLayout>
    );
}
