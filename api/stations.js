// Demo stations data for India
const STATIONS = [
  { id: 1, station_name: "Tata Power - Guindy", latitude: 13.0067, longitude: 80.2206, available_chargers: 4, price_per_kwh: 15 },
  { id: 2, station_name: "Ather Grid - T Nagar", latitude: 13.0418, longitude: 80.2341, available_chargers: 2, price_per_kwh: 12 },
  { id: 3, station_name: "EESL - Anna Nagar", latitude: 13.0850, longitude: 80.2101, available_chargers: 3, price_per_kwh: 14 },
  { id: 4, station_name: "ChargeZone - Adyar", latitude: 13.0012, longitude: 80.2565, available_chargers: 5, price_per_kwh: 16 },
  { id: 5, station_name: "Fortum Charge - OMR", latitude: 12.9516, longitude: 80.2428, available_chargers: 6, price_per_kwh: 18 },
  { id: 6, station_name: "Tata Power - Velachery", latitude: 12.9815, longitude: 80.2180, available_chargers: 3, price_per_kwh: 15 },
  { id: 7, station_name: "BESCOM - Koramangala", latitude: 12.9352, longitude: 77.6245, available_chargers: 4, price_per_kwh: 14 },
  { id: 8, station_name: "Ather Grid - Indiranagar", latitude: 12.9784, longitude: 77.6408, available_chargers: 2, price_per_kwh: 12 },
  { id: 9, station_name: "ChargeZone - Whitefield", latitude: 12.9698, longitude: 77.7500, available_chargers: 5, price_per_kwh: 17 },
  { id: 10, station_name: "Fortum Charge - Electronic City", latitude: 12.8456, longitude: 77.6603, available_chargers: 8, price_per_kwh: 18 },
  { id: 11, station_name: "Tata Power - Bandra", latitude: 19.0596, longitude: 72.8295, available_chargers: 4, price_per_kwh: 16 },
  { id: 12, station_name: "EESL - Andheri", latitude: 19.1136, longitude: 72.8697, available_chargers: 3, price_per_kwh: 15 },
  { id: 13, station_name: "ChargeZone - Powai", latitude: 19.1176, longitude: 72.9060, available_chargers: 6, price_per_kwh: 17 },
  { id: 14, station_name: "Fortum Charge - Gurugram Cyber Hub", latitude: 28.4595, longitude: 77.0266, available_chargers: 5, price_per_kwh: 19 },
  { id: 15, station_name: "Tata Power - Connaught Place", latitude: 28.6315, longitude: 77.2167, available_chargers: 4, price_per_kwh: 16 },
  { id: 16, station_name: "EESL - Noida Sector 18", latitude: 28.5706, longitude: 77.3219, available_chargers: 3, price_per_kwh: 14 },
  { id: 17, station_name: "Ather Grid - Salt Lake", latitude: 22.5726, longitude: 88.4135, available_chargers: 2, price_per_kwh: 13 },
  { id: 18, station_name: "ChargeZone - Park Street", latitude: 22.5513, longitude: 88.3520, available_chargers: 4, price_per_kwh: 15 },
  { id: 19, station_name: "Tata Power - Banjara Hills", latitude: 17.4156, longitude: 78.4347, available_chargers: 5, price_per_kwh: 15 },
  { id: 20, station_name: "EESL - HITEC City", latitude: 17.4435, longitude: 78.3772, available_chargers: 6, price_per_kwh: 16 },
];

// Haversine formula
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  const { lat, lng, radius = 50 } = req.query;

  let stations = [...STATIONS];

  if (lat && lng) {
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const maxRadius = parseFloat(radius);

    stations = stations
      .map(s => ({ ...s, distance: haversine(userLat, userLng, s.latitude, s.longitude) }))
      .filter(s => s.distance <= maxRadius)
      .sort((a, b) => a.distance - b.distance);
  }

  res.status(200).json(stations);
}
