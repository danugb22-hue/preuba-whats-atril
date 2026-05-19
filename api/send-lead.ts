import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { name, phone, section } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and Phone are required' });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const notificationEmail = process.env.NOTIFICATION_EMAIL || 'danugb22@gmail.com';

  console.log("New Serverless Lead received:", { name, phone, section });

  if (!resendApiKey) {
    console.warn("RESEND_API_KEY is not set. Lead logged to console but not emailed.");
    return res.status(200).json({ 
      success: true, 
      message: "Lead logged to console (RESEND_API_KEY missing)" 
    });
  }

  const resend = new Resend(resendApiKey);

  try {
    const data = await resend.emails.send({
      from: "Leads AutoVision <onboarding@resend.dev>",
      to: [notificationEmail],
      subject: `Nuevo Lead: ${name} (${section})`,
      html: `
        <h1>Nuevo Lead de AutoVision 360</h1>
        <p><strong>Nombre:</strong> ${name}</p>
        <p><strong>WhatsApp:</strong> ${phone}</p>
        <p><strong>Sección:</strong> ${section}</p>
        <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
      `,
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error sending email via Resend:", error);
    return res.status(500).json({ success: false, error });
  }
}
