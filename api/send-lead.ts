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

  if (!resendApiKey) {
    console.error("EROR PRODUCCIÓN: Falta la variable de entorno RESEND_API_KEY.");
    return res.status(500).json({ 
      success: false, 
      error: "Configuración incompleta: RESEND_API_KEY no encontrada." 
    });
  }

  console.log(`Intentando enviar correo a ${notificationEmail} para el lead: ${name}`);

  const resend = new Resend(resendApiKey);

  try {
    const data = await resend.emails.send({
      from: "AutoVision <onboarding@resend.dev>",
      to: [notificationEmail],
      subject: `Nuevo Lead: ${name} (${section})`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h1 style="color: #001E50;">Nuevo Lead de AutoVision 360</h1>
          <hr />
          <p><strong>Nombre:</strong> ${name}</p>
          <p><strong>WhatsApp:</strong> ${phone}</p>
          <p><strong>Sección:</strong> ${section}</p>
          <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
          <hr />
          <p style="font-size: 12px; color: #666;">Este correo fue generado automáticamente por el sistema de AutoVision 360 en Vercel.</p>
        </div>
      `,
    });

    console.log("Correo enviado exitosamente:", data);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error crítico de Resend:", error);
    return res.status(500).json({ success: false, error: "Error al enviar el correo." });
  }
}
