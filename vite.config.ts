import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { Resend } from 'resend';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  
  const resendApiKey = env.RESEND_API_KEY || process.env.RESEND_API_KEY;
  const resend = resendApiKey ? new Resend(resendApiKey) : null;
  const notificationEmail = env.NOTIFICATION_EMAIL || process.env.NOTIFICATION_EMAIL || 'danugb22@gmail.com';

  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'api-dev-server',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url === '/api/send-lead' && req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk; });
              req.on('end', async () => {
                try {
                  const payload = JSON.parse(body);
                  const { name, phone, section } = payload;
                  
                  console.log('Dev API Lead Received:', payload);

                  if (!resend) {
                    console.error('ERROR DESARROLLO: RESEND_API_KEY no configurada en .env local.');
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: false, error: 'Configuración de Resend faltante en el servidor local.' }));
                    return;
                  }

                  try {
                    await resend.emails.send({
                      from: "AutoVision <onboarding@resend.dev>",
                      to: [notificationEmail],
                      subject: `[DEV] Nuevo Lead: ${name} (${section})`,
                      html: `
                        <div style="font-family: sans-serif; padding: 20px; color: #333;">
                          <h1 style="color: #001E50;">Nuevo Lead de AutoVision 360 (MODO DESARROLLO)</h1>
                          <hr />
                          <p><strong>Nombre:</strong> ${name}</p>
                          <p><strong>WhatsApp:</strong> ${phone}</p>
                          <p><strong>Sección:</strong> ${section}</p>
                          <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
                          <hr />
                          <p style="font-size: 11px; color: #999;">Esta es una prueba desde el entorno de desarrollo local.</p>
                        </div>
                      `,
                    });
                    
                    console.log('Correo enviado correctamente desde el servidor dev.');
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: true, message: 'Email sent in Dev mode' }));
                  } catch (mailError) {
                    console.error('Error al enviar correo en dev:', mailError);
                    res.statusCode = 500;
                    res.end(JSON.stringify({ success: false, error: 'Resend falló al enviar el correo.' }));
                  }
                } catch (e) {
                  res.statusCode = 400;
                  res.end('Invalid JSON');
                }
              });
              return;
            }
            next();
          });
        }
      }
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
