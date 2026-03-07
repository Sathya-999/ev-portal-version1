export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  // Demo dashboard stats
  res.status(200).json({
    totalSessions: 24,
    totalEnergy: 156.8,
    totalCost: 2340,
    savedCO2: 78.4,
    recentSessions: [
      { id: 1, station: 'Tata Power - Guindy', date: '2026-03-06', energy: 12.5, cost: 188 },
      { id: 2, station: 'Ather Grid - T Nagar', date: '2026-03-05', energy: 8.2, cost: 98 },
      { id: 3, station: 'ChargeZone - Adyar', date: '2026-03-04', energy: 15.0, cost: 240 },
    ],
  });
}
