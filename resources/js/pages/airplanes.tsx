import { type BreadcrumbItem } from '@/types';
import MapComponent from '@/components/map';
import { useEffect, useState } from 'react';
import { getCountryCode } from '@/countryNameToCode';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Airplanes',
        href: '/airplanes',
    },
];

export default function Airplanes({ airplanes }: { airplanes: any }) {
    const [flights, setFlights] = useState<{ lat: number; lng: number; callsign: string; originCountry: string }[]>([]);

    useEffect(() => {
        setFlights(airplanes.map((airplane: any) => ({ lat: airplane.latitude, lng: airplane.longitude, callsign: airplane.callsign, originCountry: getCountryCode(airplane.originCountry) })));
    }, [airplanes]);

    return (
        <>
            <h1>Airplanes</h1>
            <div>
                <p>Total: {airplanes.length}</p>
            </div>
            <div>
                <MapComponent flights={flights} />
                {airplanes.map((airplane: any) => {
                    return (
                        <div key={airplane.icao24}>
                            <p>Callsign: {airplane.callsign}</p>
                            <p>Origin Country: {airplane.originCountry}</p>
                            <p>Time Position: {airplane.timePosition}</p>
                            <p>Last Contact: {airplane.lastContact}</p>
                            <p>Baro Altitude: {airplane.baroAltitude}</p>
                            <p>On Ground: {airplane.onGround ? 'Yes' : 'No'}</p>
                            <p>Velocity: {airplane.velocity}</p>
                            <p>Vertical Rate: {airplane.verticalRate}</p>
                        </div>
                    )
                })}
            </div>
            {/* public readonly string $icao24,
        public readonly ?string $callsign,
        public readonly string $originCountry,
        public readonly ?int $timePosition,
        public readonly int $lastContact,
        public readonly ?float $longitude,
        public readonly ?float $latitude,
        public readonly ?float $baroAltitude,
        public readonly bool $onGround,
        public readonly ?float $velocity,
        public readonly ?float $trueTrack,
        public readonly ?float $verticalRate,
        public readonly ?array $sensors,
        public readonly ?float $geoAltitude,
        public readonly ?string $squawk,
        public readonly bool $spi,
        public readonly int $positionSource,
        public readonly ?int $category = null */}
        </>

    );
}
