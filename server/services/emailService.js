import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// ─── Create SMTP Transport ───────────────────────────────────
const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass || user === 'your-email@gmail.com') {
    console.warn('[Email] SMTP not configured — emails will be logged to console.');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: { user, pass },
  });
};

const transporter = createTransporter();

// ─── Helper: send or log ─────────────────────────────────────
const sendMail = async (to, subject, html) => {
  if (transporter) {
    const info = await transporter.sendMail({
      from: `"EV-Portal" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`[Email] Sent to ${to}: ${info.messageId}`);
    return info;
  }

  // Simulation fallback — log to console
  console.log('═══════════════════════════════════════════════════');
  console.log(`📧 EMAIL (simulated)`);
  console.log(`   To:      ${to}`);
  console.log(`   Subject: ${subject}`);
  console.log('═══════════════════════════════════════════════════');
  return { messageId: `sim_${Date.now()}` };
};

// ─── Welcome Email ────────────────────────────────────────────
export const sendWelcomeEmail = async (email, firstName) => {
  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="480" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
        <tr><td style="background:#000;padding:32px 40px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:24px;font-weight:900;">⚡ EV-PORTAL</h1>
        </td></tr>
        <tr><td style="padding:40px;">
          <h2 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#111827;">Welcome, ${firstName}!</h2>
          <p style="color:#6b7280;font-size:15px;line-height:1.6;">
            Your EV-Portal account is ready. Start exploring nearby chargers, manage your vehicle fleet, and enjoy seamless payments.
          </p>
          <table width="100%"><tr><td align="center" style="padding:24px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard"
               style="display:inline-block;background:#2563eb;color:#fff;padding:14px 40px;border-radius:12px;font-size:16px;font-weight:700;text-decoration:none;">
              Go to Dashboard →
            </a>
          </td></tr></table>
          <p style="color:#d1d5db;font-size:11px;text-align:center;">© 2026 EV-Portal. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return sendMail(email, 'Welcome to EV-Portal ⚡', html);
};

// ─── Payment Confirmation ─────────────────────────────────────
export const sendPaymentConfirmationEmail = async (email, firstName, amount, newBalance) => {
  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="480" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
        <tr><td style="background:#000;padding:32px 40px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:24px;font-weight:900;">⚡ EV-PORTAL</h1>
        </td></tr>
        <tr><td style="padding:40px;">
          <h2 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#111827;">Payment Confirmed</h2>
          <p style="color:#6b7280;font-size:15px;line-height:1.6;">
            Hi ${firstName}, your wallet has been topped up successfully.
          </p>
          <table width="100%" style="margin:24px 0;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
            <tr style="background:#f9fafb;">
              <td style="padding:12px 16px;font-weight:700;color:#374151;">Amount Credited</td>
              <td style="padding:12px 16px;text-align:right;font-weight:900;color:#059669;">+₹${amount.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;font-weight:700;color:#374151;">New Balance</td>
              <td style="padding:12px 16px;text-align:right;font-weight:900;color:#111827;">₹${newBalance.toLocaleString('en-IN')}</td>
            </tr>
          </table>
          <p style="color:#d1d5db;font-size:11px;text-align:center;">© 2026 EV-Portal. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return sendMail(email, `₹${amount} credited to your EV-Portal wallet`, html);
};

// ─── Charging Session Complete ────────────────────────────────
export const sendChargingCompleteEmail = async (email, firstName, stationName, energy, amount) => {
  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="480" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
        <tr><td style="background:#000;padding:32px 40px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:24px;font-weight:900;">⚡ EV-PORTAL</h1>
        </td></tr>
        <tr><td style="padding:40px;">
          <h2 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#111827;">Charging Complete</h2>
          <p style="color:#6b7280;font-size:15px;line-height:1.6;">
            Hi ${firstName}, your charging session at <strong>${stationName}</strong> has finished.
          </p>
          <table width="100%" style="margin:24px 0;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
            <tr style="background:#f9fafb;">
              <td style="padding:12px 16px;font-weight:700;color:#374151;">Energy Used</td>
              <td style="padding:12px 16px;text-align:right;font-weight:900;">${energy} kWh</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;font-weight:700;color:#374151;">Amount Charged</td>
              <td style="padding:12px 16px;text-align:right;font-weight:900;color:#dc2626;">₹${amount}</td>
            </tr>
          </table>
          <p style="color:#d1d5db;font-size:11px;text-align:center;">© 2026 EV-Portal. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return sendMail(email, `Charging session at ${stationName} complete`, html);
};

// ─── Password Reset ───────────────────────────────────────────
export const sendPasswordResetEmail = async (email, resetLink) => {
  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="480" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
        <tr><td style="background:#000;padding:32px 40px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:24px;font-weight:900;">⚡ EV-PORTAL</h1>
        </td></tr>
        <tr><td style="padding:40px;">
          <h2 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#111827;">Reset Your Password</h2>
          <p style="color:#6b7280;font-size:15px;line-height:1.6;">
            We received a request to reset your password. Click below to create a new one.
          </p>
          <table width="100%"><tr><td align="center" style="padding:24px 0;">
            <a href="${resetLink}"
               style="display:inline-block;background:#2563eb;color:#fff;padding:14px 40px;border-radius:12px;font-size:16px;font-weight:700;text-decoration:none;">
              Reset Password →
            </a>
          </td></tr></table>
          <p style="color:#9ca3af;font-size:13px;">If you didn't request this, you can safely ignore this email. This link expires in 1 hour.</p>
          <p style="color:#d1d5db;font-size:11px;text-align:center;margin-top:24px;">© 2026 EV-Portal. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return sendMail(email, 'Reset your EV-Portal password', html);
};
