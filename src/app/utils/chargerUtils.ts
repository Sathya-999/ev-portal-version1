export interface Charger {
  id: number;
  name: string;
  lat: number;
  lng: number;
  totalCapacity: number; // in kW
  availableCapacity: number; // in kW
  availableSlots: number;
  totalSlots: number;
  connectorTypes: string[];
  pricePerKwh: number;
  peakHours: string; // e.g. "18-21" (6PM-9PM)
  distance?: number;
  address?: string;
  queueCount: number;
}

export const HAWAII_CHARGERS: Charger[] = [
  // --- Chennai (Tamil Nadu) ---
  { id: 1, name: "TNEB Fast Charge — Guindy", lat: 13.0067, lng: 80.2206, totalCapacity: 120, availableCapacity: 80, availableSlots: 3, totalSlots: 4, connectorTypes: ["CCS2", "Bharat DC001"], pricePerKwh: 14.0, peakHours: "18-21", queueCount: 0 },
  { id: 2, name: "Adyar EV Hub", lat: 13.0033, lng: 80.2550, totalCapacity: 50, availableCapacity: 25, availableSlots: 1, totalSlots: 3, connectorTypes: ["Type 2", "Bharat AC001"], pricePerKwh: 12.5, peakHours: "12-14", queueCount: 1 },
  { id: 3, name: "Marina Beach Solar Charge", lat: 13.0500, lng: 80.2824, totalCapacity: 30, availableCapacity: 20, availableSlots: 2, totalSlots: 4, connectorTypes: ["CCS2", "CHAdeMO"], pricePerKwh: 11.0, peakHours: "17-20", queueCount: 0 },
  { id: 4, name: "Anna Nagar Supercharger", lat: 13.0850, lng: 80.2101, totalCapacity: 250, availableCapacity: 150, availableSlots: 6, totalSlots: 8, connectorTypes: ["CCS2"], pricePerKwh: 18.5, peakHours: "08-10", queueCount: 0 },
  { id: 5, name: "OMR Tech Park EV Station", lat: 12.9249, lng: 80.2272, totalCapacity: 60, availableCapacity: 30, availableSlots: 2, totalSlots: 4, connectorTypes: ["CCS2", "Type 2"], pricePerKwh: 15.0, peakHours: "09-11", queueCount: 2 },
  { id: 6, name: "T. Nagar Tata Power Hub", lat: 13.0418, lng: 80.2341, totalCapacity: 100, availableCapacity: 60, availableSlots: 3, totalSlots: 5, connectorTypes: ["CCS2", "Bharat DC001"], pricePerKwh: 16.0, peakHours: "18-21", queueCount: 0 },
  { id: 7, name: "Tambaram BESCOM Station", lat: 12.9249, lng: 80.1185, totalCapacity: 50, availableCapacity: 0, availableSlots: 0, totalSlots: 4, connectorTypes: ["Bharat AC001", "Type 2"], pricePerKwh: 10.5, peakHours: "17-20", queueCount: 4 },

  // --- Coimbatore (Tamil Nadu) ---
  { id: 8, name: "Coimbatore RS Puram Charge Point", lat: 11.0168, lng: 76.9558, totalCapacity: 60, availableCapacity: 40, availableSlots: 2, totalSlots: 3, connectorTypes: ["CCS2", "Type 2"], pricePerKwh: 13.0, peakHours: "18-21", queueCount: 0 },
  { id: 9, name: "Gandhipuram EV Fast Charge", lat: 11.0183, lng: 76.9725, totalCapacity: 120, availableCapacity: 90, availableSlots: 4, totalSlots: 6, connectorTypes: ["CCS2", "Bharat DC001"], pricePerKwh: 15.5, peakHours: "09-11", queueCount: 1 },

  // --- Madurai (Tamil Nadu) ---
  { id: 10, name: "Madurai Meenakshi EV Hub", lat: 9.9252, lng: 78.1198, totalCapacity: 50, availableCapacity: 30, availableSlots: 2, totalSlots: 4, connectorTypes: ["CCS2", "CHAdeMO"], pricePerKwh: 12.0, peakHours: "18-21", queueCount: 0 },
  { id: 11, name: "Madurai Bypass Tata Power", lat: 9.9391, lng: 78.0747, totalCapacity: 80, availableCapacity: 50, availableSlots: 3, totalSlots: 5, connectorTypes: ["CCS2", "Type 2"], pricePerKwh: 14.5, peakHours: "12-14", queueCount: 0 },

  // --- Bangalore (Karnataka) ---
  { id: 12, name: "Tata Power EZ Charge — MG Road", lat: 12.9716, lng: 77.5946, totalCapacity: 120, availableCapacity: 100, availableSlots: 3, totalSlots: 4, connectorTypes: ["CCS2", "Type 2"], pricePerKwh: 18.5, peakHours: "18-21", queueCount: 0 },
  { id: 13, name: "Jio-bp Pulse Hub — Koramangala", lat: 12.9352, lng: 77.6245, totalCapacity: 50, availableCapacity: 25, availableSlots: 1, totalSlots: 2, connectorTypes: ["Bharat DC001", "CCS2"], pricePerKwh: 15.0, peakHours: "12-14", queueCount: 2 },
  { id: 14, name: "Ather Grid — Indiranagar", lat: 12.9816, lng: 77.6408, totalCapacity: 250, availableCapacity: 180, availableSlots: 5, totalSlots: 12, connectorTypes: ["CCS2"], pricePerKwh: 22.0, peakHours: "08-10", queueCount: 0 },

  // --- Hyderabad (Telangana) ---
  { id: 15, name: "HMDA EV Hub — Gachibowli", lat: 17.4400, lng: 78.3489, totalCapacity: 100, availableCapacity: 60, availableSlots: 3, totalSlots: 6, connectorTypes: ["CCS2", "Type 2"], pricePerKwh: 16.0, peakHours: "18-21", queueCount: 1 },
  { id: 16, name: "Hitech City Charge Station", lat: 17.4486, lng: 78.3908, totalCapacity: 60, availableCapacity: 40, availableSlots: 2, totalSlots: 4, connectorTypes: ["CCS2", "Bharat DC001"], pricePerKwh: 14.5, peakHours: "09-11", queueCount: 0 },

  // --- Mumbai (Maharashtra) ---
  { id: 17, name: "BEST EV Station — Bandra", lat: 19.0596, lng: 72.8295, totalCapacity: 150, availableCapacity: 90, availableSlots: 4, totalSlots: 8, connectorTypes: ["CCS2", "CHAdeMO", "Type 2"], pricePerKwh: 20.0, peakHours: "18-21", queueCount: 0 },
  { id: 18, name: "Tata Power — Andheri", lat: 19.1136, lng: 72.8697, totalCapacity: 80, availableCapacity: 50, availableSlots: 2, totalSlots: 4, connectorTypes: ["CCS2", "Bharat DC001"], pricePerKwh: 17.5, peakHours: "12-14", queueCount: 3 },

  // --- Delhi NCR ---
  { id: 19, name: "EESL Charge Point — Connaught Place", lat: 28.6315, lng: 77.2167, totalCapacity: 120, availableCapacity: 80, availableSlots: 3, totalSlots: 6, connectorTypes: ["CCS2", "Bharat DC001"], pricePerKwh: 16.5, peakHours: "18-21", queueCount: 1 },
  { id: 20, name: "Fortum Charge — Gurugram Cyber Hub", lat: 28.4949, lng: 77.0890, totalCapacity: 200, availableCapacity: 140, availableSlots: 5, totalSlots: 10, connectorTypes: ["CCS2", "Type 2", "CHAdeMO"], pricePerKwh: 19.0, peakHours: "08-10", queueCount: 0 },

  // --- Trichy (Tamil Nadu) ---
  { id: 21, name: "Trichy TNEB SmartCharge", lat: 10.7905, lng: 78.7047, totalCapacity: 50, availableCapacity: 35, availableSlots: 2, totalSlots: 3, connectorTypes: ["CCS2", "Bharat AC001"], pricePerKwh: 11.5, peakHours: "18-21", queueCount: 0 },

  // --- Salem (Tamil Nadu) ---
  { id: 22, name: "Salem Highway EV Point", lat: 11.6643, lng: 78.1460, totalCapacity: 60, availableCapacity: 45, availableSlots: 2, totalSlots: 3, connectorTypes: ["CCS2", "Type 2"], pricePerKwh: 12.0, peakHours: "12-14", queueCount: 0 },
];

export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export function isPeakHour(peakHours: string): boolean {
  const currentHour = new Date().getHours();
  const [start, end] = peakHours.split('-').map(Number);
  return currentHour >= start && currentHour <= end;
}
