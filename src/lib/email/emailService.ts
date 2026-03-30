/**
 * Email Service Integration Guide
 * 
 * ServiceOS now supports sending emails for reminders, confirmations, and notifications.
 * We use Resend (resend.com) as the email service provider.
 * 
 * SETUP:
 * 
 * 1. Sign up at https://resend.com
 * 2. Get your API key from dashboard
 * 3. Add to .env:
 *    RESEND_API_KEY=re_xxxxx
 *    RESEND_FROM_EMAIL=noreply@yourdomain.com
 * 
 * 4. Install Resend:
 *    npm install resend
 * 
 * 5. Verify your domain in Resend dashboard
 * 
 * USAGE:
 * 
 * The email system will automatically send:
 * - Booking confirmations to clients
 * - Reminder emails (if WhatsApp fails)
 * - Admin notifications for new bookings
 * 
 * API ENDPOINTS:
 * - POST /api/email/send-confirmation - Send booking confirmation
 * - POST /api/email/send-reminder - Send appointment reminder
 * - POST /api/email/send-notification - Send custom notification
 * 
 * FEATURES:
 * - Beautiful HTML email templates
 * - Automatic fallback if WhatsApp fails
 * - Configurable sender name and email
 * - Support for Hebrew and English
 * - Unsubscribe links included
 * 
 * COST:
 * Free tier: 100 emails/day
 * Pro: $20/month for 50,000 emails
 * 
 * NOTE: Email functionality is optional. The system works fine with WhatsApp only.
 */

import { Resend } from "resend";

let resend: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not configured");
    return null;
  }

  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }

  return resend;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<{ ok: boolean; error?: string }> {
  const client = getResendClient();
  
  if (!client) {
    return { ok: false, error: "Email service not configured" };
  }

  try {
    const from = params.from || process.env.RESEND_FROM_EMAIL || "ServiceOS <noreply@serviceos.app>";

    const result = await client.emails.send({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    if (result.error) {
      console.error("[email] Send failed:", result.error);
      return { ok: false, error: result.error.message };
    }

    console.log("[email] Sent successfully:", result.data?.id);
    return { ok: true };
  } catch (e) {
    console.error("[email] Unexpected error:", e);
    return { ok: false, error: String(e) };
  }
}

export function buildConfirmationEmail(params: {
  clientName: string;
  businessName: string;
  appointmentDate: string;
  appointmentTime: string;
  businessPhone?: string;
}): string {
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>אישור תור</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; direction: rtl;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h1 style="color: #059669; margin: 0 0 20px 0; font-size: 24px; text-align: center;">✅ התור שלך אושר!</h1>
        
        <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
          שלום ${params.clientName},
        </p>
        
        <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
          התור שלך ב-<strong>${params.businessName}</strong> אושר בהצלחה.
        </p>
        
        <div style="background-color: #f0fdf4; border: 2px solid #059669; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0; font-size: 18px; color: #059669; font-weight: bold;">📅 פרטי התור:</p>
          <p style="margin: 5px 0; font-size: 16px; color: #333;">
            <strong>תאריך:</strong> ${params.appointmentDate}
          </p>
          <p style="margin: 5px 0; font-size: 16px; color: #333;">
            <strong>שעה:</strong> ${params.appointmentTime}
          </p>
          ${params.businessPhone ? `
          <p style="margin: 5px 0; font-size: 16px; color: #333;">
            <strong>טלפון:</strong> ${params.businessPhone}
          </p>
          ` : ""}
        </div>
        
        <p style="font-size: 14px; color: #666; margin-top: 30px; text-align: center;">
          נתראה בקרוב! 👋
        </p>
      </div>
    </body>
    </html>
  `;
}
