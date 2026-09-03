import { prisma } from './prisma.js';
import { env } from './env.js';

export class NotificationService {
  private static RESEND_API_KEY = env.RESEND_API_KEY;
  private static TWILIO_ACCOUNT_SID = env.TWILIO_ACCOUNT_SID;
  private static TWILIO_AUTH_TOKEN = env.TWILIO_AUTH_TOKEN;
  private static TWILIO_PHONE_NUMBER = env.TWILIO_PHONE_NUMBER;
  private static RESEND_FROM_EMAIL = env.RESEND_FROM_EMAIL || 'noreply@powerbank.app';

  static async sendEmail(to: string, subject: string, html: string) {
    if (!this.RESEND_API_KEY) {
      console.log(`[Notification Fallback] Email to ${to} | Subject: ${subject}`);
      console.log(`[Notification Fallback] Body: ${html}`);
      return;
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.RESEND_FROM_EMAIL,
          to,
          subject,
          html,
        }),
      });
      if (!response.ok) {
        console.error('Failed to send email via Resend:', await response.text());
      }
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }

  static async sendSMS(to: string, body: string) {
    if (!this.TWILIO_ACCOUNT_SID || !this.TWILIO_AUTH_TOKEN || !this.TWILIO_PHONE_NUMBER) {
      console.log(`[Notification Fallback] SMS to ${to} | Body: ${body}`);
      return;
    }

    try {
      const auth = Buffer.from(`${this.TWILIO_ACCOUNT_SID}:${this.TWILIO_AUTH_TOKEN}`).toString('base64');
      const params = new URLSearchParams();
      params.append('To', to);
      params.append('From', this.TWILIO_PHONE_NUMBER);
      params.append('Body', body);

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${this.TWILIO_ACCOUNT_SID}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        console.error('Failed to send SMS via Twilio:', await response.text());
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
    }
  }

  static async notifyAffectedCustomers(feederId: string, subject: string, message: string) {
    const feeder = await prisma.feeder.findUnique({
      where: { id: feederId },
      include: {
        areas: {
          include: {
            users: {
              where: { role: 'CUSTOMER' }
            }
          }
        }
      }
    });

    if (!feeder) return;

    const users = feeder.areas.flatMap(area => area.users);
    
    // Deduplicate users just in case they belong to multiple areas (though schema says Area 1:N User)
    const uniqueUsers = Array.from(new Map(users.map(u => [u.id, u])).values());

    for (const user of uniqueUsers) {
      if (user.email) {
        // We're firing and forgetting to not block the main thread
        this.sendEmail(user.email, subject, `<p>Hello ${user.name},</p><p>${message}</p>`).catch(console.error);
      }
      
      const phone = (user as any).phoneNumber;
      if (phone) {
        this.sendSMS(phone, `PowerBank Alert: ${message}`).catch(console.error);
      }
    }
  }
}
