import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// In-memory user storage (for demo - replace with database in production)
const users = new Map();

const JWT_SECRET = process.env.JWT_SECRET || 'ev-portal-demo-secret-2024';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  const { action } = req.query;

  try {
    if (action === 'signup' && req.method === 'POST') {
      const { firstName, lastName, email, password } = req.body;

      if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      if (users.has(email)) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = users.size + 1;
      
      const user = {
        id: userId,
        firstName,
        lastName,
        email,
        password: hashedPassword,
        createdAt: new Date().toISOString(),
      };
      
      users.set(email, user);

      const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '7d' });

      return res.status(201).json({
        token,
        user: { id: userId, firstName, lastName, email },
      });
    }

    if (action === 'login' && req.method === 'POST') {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const user = users.get(email);
      
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const isValid = await bcrypt.compare(password, user.password);
      
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const token = jwt.sign({ id: user.id, email }, JWT_SECRET, { expiresIn: '7d' });

      return res.status(200).json({
        token,
        user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email },
      });
    }

    if (action === 'me' && req.method === 'GET') {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = authHeader.split(' ')[1];
      
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = users.get(decoded.email);
        
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        });
      } catch {
        return res.status(401).json({ error: 'Invalid token' });
      }
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
