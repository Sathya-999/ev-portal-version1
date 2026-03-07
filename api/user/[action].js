import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ev-portal-demo-secret-2024';

// In-memory storage for demo
const userProfiles = new Map();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  const { action } = req.query;
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (action === 'me' && req.method === 'GET') {
    const profile = userProfiles.get(decoded.email) || {
      id: decoded.id,
      firstName: 'Demo',
      lastName: 'User',
      email: decoded.email,
      phone: '',
      walletBalance: 500,
    };
    return res.status(200).json(profile);
  }

  if (action === 'update' && req.method === 'PATCH') {
    const existing = userProfiles.get(decoded.email) || { id: decoded.id, email: decoded.email };
    const updated = { ...existing, ...req.body };
    userProfiles.set(decoded.email, updated);
    return res.status(200).json(updated);
  }

  return res.status(404).json({ error: 'Not found' });
}
