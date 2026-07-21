import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const FROM_EMAIL = process.env.FROM_EMAIL || 'RescueLink <notifications@rescuelink.org>';

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!resend) {
    console.log(`[EMAIL SIMULATION] To: ${to} | Subject: ${subject}`);
    return { success: true, simulated: true };
  }

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });
    return { success: true, data };
  } catch (err) {
    console.error(`[EMAIL ERROR] Failed to send email to ${to}:`, err);
    return { success: false, error: err };
  }
}

export async function sendNewVolunteerNotification({
  posterEmail,
  posterName,
  missionTitle,
  volunteerName,
  missionId,
}: {
  posterEmail: string;
  posterName: string;
  missionTitle: string;
  volunteerName: string;
  missionId: string;
}) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; rounded: 12px;">
      <h2 style="color: #d97706;">RescueLink Alert</h2>
      <p>Hi ${posterName || 'Coordinator'},</p>
      <p>Great news! <strong>${volunteerName}</strong> has joined your mission: <strong>"${missionTitle}"</strong>.</p>
      <p style="margin: 20px 0;">
        <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/missions/${missionId}" style="background: #dc2626; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; display: inline-block;">
          View Mission Details
        </a>
      </p>
      <p style="color: #666; font-size: 12px;">Thank you for coordinating disaster response on RescueLink.</p>
    </div>
  `;

  return sendEmail({
    to: posterEmail,
    subject: `New Volunteer Joined: "${missionTitle}"`,
    html,
  });
}

export async function sendMissionUpdateNotification({
  volunteerEmail,
  volunteerName,
  missionTitle,
  updateMessage,
  authorName,
  missionId,
}: {
  volunteerEmail: string;
  volunteerName: string;
  missionTitle: string;
  updateMessage: string;
  authorName: string;
  missionId: string;
}) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; rounded: 12px;">
      <h2 style="color: #dc2626;">Mission Status Update</h2>
      <p>Hi ${volunteerName || 'Volunteer'},</p>
      <p>A new update was posted for a mission you joined: <strong>"${missionTitle}"</strong>.</p>
      <div style="background: #f9fafb; padding: 16px; border-left: 4px solid #dc2626; margin: 16px 0; border-radius: 4px;">
        <p style="margin: 0; font-weight: bold; color: #111;">${authorName}:</p>
        <p style="margin: 6px 0 0 0; color: #374151;">"${updateMessage}"</p>
      </div>
      <p style="margin: 20px 0;">
        <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/missions/${missionId}" style="background: #dc2626; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; display: inline-block;">
          View Mission Updates
        </a>
      </p>
      <p style="color: #666; font-size: 12px;">RescueLink Disaster Response Team</p>
    </div>
  `;

  return sendEmail({
    to: volunteerEmail,
    subject: `Update on Mission: "${missionTitle}"`,
    html,
  });
}

export async function sendWelcomeEmail({ email, name }: { email: string; name: string }) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; rounded: 12px;">
      <h2 style="color: #dc2626;">Welcome to RescueLink!</h2>
      <p>Hi ${name || 'there'},</p>
      <p>Thank you for joining <strong>RescueLink</strong> — the platform connecting disaster response teams, verified organizations, and volunteers in crisis situations.</p>
      <p style="margin: 20px 0;">
        <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/explore" style="background: #dc2626; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; display: inline-block;">
          Explore Active Missions
        </a>
      </p>
      <p style="color: #666; font-size: 12px;">Together we save lives and strengthen emergency response.</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Welcome to RescueLink Emergency Response Platform',
    html,
  });
}
