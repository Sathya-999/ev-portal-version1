import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { Station, ChargerSlot } from '../models/index.js';

const router = Router();
const GEMINI_API_KEY = 'AIzaSyBj8Qr-pIuvEvw_MUJFhwPEpN5c-Wu3A2s';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// ─── Build system context with live station data ──────────────
async function buildSystemContext() {
  try {
    const stations = await Station.findAll({ order: [['station_name', 'ASC']] });
    const slots = await ChargerSlot.findAll();

    const stationInfo = stations.map((s) => {
      const stSlots = slots.filter((sl) => sl.station_id === s.id);
      const available = stSlots.filter((sl) => sl.status === 'AVAILABLE').length;
      const booked = stSlots.filter((sl) => sl.status === 'BOOKED').length;
      const charging = stSlots.filter((sl) => sl.status === 'ACTIVE_CHARGING').length;
      return `• ${s.station_name} (${s.latitude}, ${s.longitude}) — ₹${s.price_per_kwh}/kWh, ${s.available_chargers} chargers, Slots: ${available} free / ${booked} booked / ${charging} charging / ${stSlots.length} total`;
    }).join('\n');

    return `You are an EV Charging Assistant for an Indian EV Portal. You help users with:
- Finding nearby charging stations
- Battery and charging advice
- Pricing information
- Slot booking guidance
- Payment help (UPI/PhonePe QR scanner)
- General EV tips

LIVE STATION DATA (from MySQL database):
${stationInfo}

RULES:
- Be concise, friendly, and helpful.
- Use Indian Rupee (₹) for prices.
- When recommending stations, mention name, price, and available slots.
- If asked about booking, tell users to go to the Stations Map page and click a marker to book a slot.
- Slots expire in 15 minutes if the user doesn't confirm arrival via QR scan.
- Payment is done via UPI QR scanner on the Payments page.
- Keep responses under 150 words unless the user asks for detailed info.`;
  } catch (err) {
    console.error('[Chatbot] Failed to build context:', err.message);
    return 'You are an EV Charging Assistant for an Indian EV Portal. Help users find chargers, book slots, and manage payments.';
  }
}

// ─── POST /api/chatbot — send message to Gemini ──────────────
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const systemContext = await buildSystemContext();

    // Build conversation contents for Gemini
    const contents = [];

    // System instruction as first user turn
    contents.push({
      role: 'user',
      parts: [{ text: `[SYSTEM INSTRUCTION]\n${systemContext}\n\n[END SYSTEM INSTRUCTION]\nAcknowledge briefly.` }],
    });
    contents.push({
      role: 'model',
      parts: [{ text: 'Understood! I\'m your EV Charging Assistant. How can I help you today?' }],
    });

    // Append conversation history (last 10 exchanges max)
    if (Array.isArray(history)) {
      const recent = history.slice(-20); // last 20 messages = ~10 exchanges
      for (const h of recent) {
        contents.push({
          role: h.sender === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }],
        });
      }
    }

    // Current user message
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const body = {
      contents,
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 512,
      },
    };

    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('[Chatbot] Gemini API error:', response.status, errBody);
      return res.status(502).json({ error: 'AI service unavailable. Please try again.' });
    }

    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I couldn\'t generate a response. Please try again.';

    return res.json({ reply });
  } catch (err) {
    console.error('[Chatbot] Error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
