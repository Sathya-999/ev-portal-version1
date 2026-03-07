
export interface Charger {
    id: string;
    name: string;
    lat: number;
    lng: number;
    totalCapacity: number;
    availableCapacity: number;
    connectorType: string;
    pricePerKwh: number;
    distance?: number;
}

export const chargersData: Charger[] = [
    { id: '1', name: 'TNEB Fast Charge — Guindy', lat: 13.0067, lng: 80.2206, totalCapacity: 120, availableCapacity: 80, connectorType: 'CCS2', pricePerKwh: 14 },
    { id: '2', name: 'Adyar EV Hub', lat: 13.0033, lng: 80.2550, totalCapacity: 50, availableCapacity: 25, connectorType: 'Type 2', pricePerKwh: 12.5 },
    { id: '3', name: 'Marina Beach Solar Charge', lat: 13.0500, lng: 80.2824, totalCapacity: 30, availableCapacity: 20, connectorType: 'CCS2', pricePerKwh: 11 },
    { id: '4', name: 'Anna Nagar Supercharger', lat: 13.0850, lng: 80.2101, totalCapacity: 250, availableCapacity: 150, connectorType: 'CCS2', pricePerKwh: 18.5 },
    { id: '5', name: 'OMR Tech Park EV Station', lat: 12.9249, lng: 80.2272, totalCapacity: 60, availableCapacity: 30, connectorType: 'CCS2', pricePerKwh: 15 },
    { id: '6', name: 'T. Nagar Tata Power Hub', lat: 13.0418, lng: 80.2341, totalCapacity: 100, availableCapacity: 60, connectorType: 'CCS2', pricePerKwh: 16 },
    { id: '7', name: 'Tambaram BESCOM Station', lat: 12.9249, lng: 80.1185, totalCapacity: 50, availableCapacity: 0, connectorType: 'Bharat AC001', pricePerKwh: 10.5 },
    { id: '8', name: 'Coimbatore RS Puram Charge Point', lat: 11.0168, lng: 76.9558, totalCapacity: 60, availableCapacity: 40, connectorType: 'CCS2', pricePerKwh: 13 },
    { id: '9', name: 'Madurai Meenakshi EV Hub', lat: 9.9252, lng: 78.1198, totalCapacity: 50, availableCapacity: 30, connectorType: 'CCS2', pricePerKwh: 12 },
    { id: '10', name: 'Trichy TNEB SmartCharge', lat: 10.7905, lng: 78.7047, totalCapacity: 50, availableCapacity: 35, connectorType: 'CCS2', pricePerKwh: 11.5 },
    { id: '11', name: 'Salem Highway EV Point', lat: 11.6643, lng: 78.1460, totalCapacity: 60, availableCapacity: 45, connectorType: 'CCS2', pricePerKwh: 12 },
];

export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
}

export function sortChargersByDistance(userLat: number, userLng: number, chargers: Charger[]) {
    return chargers
        .map(c => ({ ...c, distance: getDistance(userLat, userLng, c.lat, c.lng) }))
        .filter(c => c.distance! <= 10) // Only within 10km
        .sort((a, b) => a.distance! - b.distance!);
}
