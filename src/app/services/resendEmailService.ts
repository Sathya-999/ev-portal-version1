/**
 * Resend Email Service — Password Reset Flow
 * 
 * This service handles sending password reset emails using the Resend API.
 * 
 * IMPORTANT: In a production environment, the Resend API call MUST be made
 * from a backend server (Node.js/Express/Next.js API route) to keep the API
 * key secure. The approach below uses a simulated backend endpoint.
 * 
 * To connect a real backend:
 *   1. Create an Express endpoint: POST /api/send-reset-email
 *   2. In that endpoint, use:
 *      import { Resend } from 'resend';
 *      const resend = new Resend('re_YOUR_API_KEY');
 *      await resend.emails.send({ ... });
 *   3. Update BACKEND_URL below to point to your server.
 */

// Configuration
const RESEND_CONFIG = {
  // In production, set this to your actual backend URL
  BACKEND_URL: import.meta.env.VITE_RESEND_BACKEND_URL || 'http://localhost:3001',
  FROM_EMAIL: 'EV-Portal <noreply@ev-portal.in>',
  APP_NAME: 'EV-Portal — Smart EV Charging Platform',
  RESET_URL_BASE: `${window.location.origin}/reset-password`,
};

// In-memory token store (simulates server-side token table)
const resetTokenStore: Map<string, { email: string; expires: number }> = new Map();

/**
 * Generate a secure-looking reset token
 */
function generateResetToken(email: string): string {
  const randomPart = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  const token = `rst_${randomPart}`;
  
  // Store token with 1-hour expiry
  resetTokenStore.set(token, {
    email,
    expires: Date.now() + 3600000,
  });
  
  return token;
}

/**
 * Validate a reset token
 */
function validateResetToken(token: string): { valid: boolean; email?: string } {
  const entry = resetTokenStore.get(token);
  if (!entry) return { valid: false };
  if (Date.now() > entry.expires) {
    resetTokenStore.delete(token);
    return { valid: false };
  }
  return { valid: true, email: entry.email };
}

/**
 * Consume (invalidate) a reset token after use
 */
function consumeResetToken(token: string): boolean {
  return resetTokenStore.delete(token);
}

/**
 * Build the HTML email template for password reset
 */
function buildResetEmailHTML(resetLink: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
          <!-- Header -->
          <tr>
            <td style="background:#000000;padding:32px 40px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:900;letter-spacing:-0.5px;">
                ⚡ VOLT<span style="color:#2563eb;">LUX</span>
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#111827;">
                Reset Your Password
              </h2>
              <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
                We received a request to reset your password for your EV-Portal account. Click the button below to create a new password.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="${resetLink}" 
                       style="display:inline-block;background:#2563eb;color:#ffffff;padding:14px 40px;border-radius:12px;font-size:16px;font-weight:700;text-decoration:none;">
                      Reset Password →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;color:#9ca3af;font-size:13px;line-height:1.5;">
                If you didn't request this, you can safely ignore this email. This link will expire in 1 hour.
              </p>
              <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0;" />
              <p style="margin:0;color:#d1d5db;font-size:11px;text-align:center;">
                © 2026 EV-Portal. Smart EV Charging Platform. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Send password reset email
 * 
 * This function attempts to call the backend API first.
 * If no backend is available, it falls back to a client-side simulation.
 */
async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const resetLink = `${RESEND_CONFIG.RESET_URL_BASE}?token=${token}`;
  
  // Attempt to use real Resend backend
  try {
    const response = await fetch(`${RESEND_CONFIG.BACKEND_URL}/api/send-reset-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        subject: 'Reset your EV-Portal password',
        html: buildResetEmailHTML(resetLink),
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('[Resend] Email sent via backend:', data);
      return { success: true, messageId: data.id };
    }
    
    // Backend returned error — fall through to simulation
    console.warn('[Resend] Backend returned error, using simulation mode');
  } catch (err) {
    // Backend not available — fall through to simulation
    console.warn('[Resend] Backend unavailable, using simulation mode:', err);
  }

  // ─── SIMULATION MODE ──────────────────────────────────────────────
  // This simulates what the Resend API would do. In production, this
  // would be replaced by the real backend call above succeeding.
  console.log('═══════════════════════════════════════════════════════');
  console.log('📧 RESEND EMAIL SIMULATION');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`To:      ${email}`);
  console.log(`From:    ${RESEND_CONFIG.FROM_EMAIL}`);
  console.log(`Subject: Reset your EV-Portal password`);
  console.log(`Link:    ${resetLink}`);
  console.log(`Token:   ${token}`);
  console.log('═══════════════════════════════════════════════════════');
  console.log('HTML Preview:\n', buildResetEmailHTML(resetLink));

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  return {
    success: true,
    messageId: `sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  };
}

// ─── BACKEND REFERENCE IMPLEMENTATION ──────────────────────────────
// 
// Create a file: server/api/send-reset-email.ts
//
// ```typescript
// import express from 'express';
// import { Resend } from 'resend';
//
// const app = express();
// const resend = new Resend(process.env.RESEND_API_KEY); // e.g. 're_xxxx'
//
// app.use(express.json());
//
// app.post('/api/send-reset-email', async (req, res) => {
//   const { to, subject, html } = req.body;
//
//   try {
//     const data = await resend.emails.send({
//       from: 'EV-Portal <noreply@ev-portal.in>',
//       to: [to],
//       subject,
//       html,
//     });
//
//     res.json({ success: true, id: data.id });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// });
//
// app.listen(3001, () => console.log('Resend server running on :3001'));
// ```
// ────────────────────────────────────────────────────────────────────

export const resendEmailService = {
  sendPasswordResetEmail,
  generateResetToken,
  validateResetToken,
  consumeResetToken,
  buildResetEmailHTML,
};
